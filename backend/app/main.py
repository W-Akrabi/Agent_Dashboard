from __future__ import annotations

import asyncio
import secrets
import ssl
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
import logging
from typing import Any
from urllib.parse import urlparse
from uuid import UUID

import certifi

import jwt
import psycopg
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from jwt import PyJWKClient, PyJWKClientError
from psycopg import Connection
from psycopg.types.json import Jsonb

from .config import get_settings
from .db import close_db_pool, get_db, get_db_pool, init_db_pool
from .schemas import (
    AgentCreateRequest,
    AgentCreateResponse,
    AgentEventResponse,
    AgentResponse,
    AgentStatusUpdateRequest,
    AgentTokenRevealResponse,
    BudgetUpdateRequest,
    CommandResponse,
    CommsAgentSummary,
    CommsMessageResponse,
    CommsReplyRequest,
    CommsSendRequest,
    CommsStreamChunkRequest,
    CommsTypingRequest,
    EventIngestRequest,
    EventIngestResponse,
    InboxDecisionRequest,
    InboxItemResponse,
    InboxStatus,
    SpendResponse,
    VaultSecretCreateRequest,
    VaultSecretResponse,
    VaultSecretRevealResponse,
    WebhookEventRequest,
    WebhookEventResponse,
    WorkshopTaskCreateRequest,
    WorkshopTaskResponse,
    WorkshopTaskStatusUpdateRequest,
    WorkshopTaskUpdateRequest,
)
from .security import (
    decrypt_secret,
    encrypt_secret,
    generate_agent_token,
    hash_agent_token,
    mask_secret_value,
    mask_token_hash,
    verify_control_plane_token,
)

settings = get_settings()
_jwks_clients: dict[str, PyJWKClient] = {}
logger = logging.getLogger(__name__)
_warned_missing_cryptography = False

# ── SSE broadcaster ───────────────────────────────────────────────────────────
# Maps channel name → list of per-connection queues.
# Sync request handlers call _sse_publish(); async SSE generators await queue.get().
_sse_queues: dict[str, list[asyncio.Queue[str]]] = defaultdict(list)
_sse_loop: asyncio.AbstractEventLoop | None = None

# ── SSE short-lived token store ───────────────────────────────────────────────
# Maps opaque token → (user_id, workspace_id, expiry_epoch_seconds).
# Tokens are 30-second, single-use: consumed on first SSE connection.
_SSE_TOKEN_TTL = 30
_sse_tokens: dict[str, tuple[UUID, UUID, float]] = {}


def _sse_publish(channel: str, data: str = "update") -> None:
    """Notify all SSE listeners on *channel* from a sync request handler."""
    if _sse_loop is None:
        return
    for q in list(_sse_queues.get(channel, [])):
        try:
            _sse_loop.call_soon_threadsafe(q.put_nowait, data)
        except Exception:
            pass


try:
    import cryptography as _cryptography  # type: ignore
except ModuleNotFoundError:
    _cryptography = None


@dataclass(frozen=True)
class AuthenticatedUser:
    id: UUID
    email: str
    workspace_id: UUID


def _to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _compute_agent_status(last_seen: datetime | None) -> str:
    if last_seen is None:
        return "offline"
    now = datetime.now(timezone.utc)
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)
    age = (now - last_seen).total_seconds()
    if age <= 120:
        return "online"
    if age <= 600:
        return "idle"
    return "offline"


def _agent_from_row(row: dict[str, Any]) -> AgentResponse:
    last_seen = row["last_seen"]
    return AgentResponse(
        id=row["id"],
        name=row["name"],
        status=_compute_agent_status(last_seen),
        totalSpend=_to_float(row["total_spend"]),
        lastSeen=last_seen,
        tokenHash=mask_token_hash(row["token_hash"]),
        eventsCount=int(row["events_count"] or 0),
        description=row.get("description"),
        createdAt=row["created_at"],
    )


def _event_from_row(row: dict[str, Any]) -> AgentEventResponse:
    return AgentEventResponse(
        id=row["id"],
        agentId=row["agent_id"],
        type=row["type"],
        message=row["message"],
        cost=_to_float(row["cost"]),
        createdAt=row["created_at"],
    )


def _inbox_from_row(row: dict[str, Any]) -> InboxItemResponse:
    completed_actions = row.get("completed_actions") or []
    if not isinstance(completed_actions, list):
        completed_actions = []
    return InboxItemResponse(
        id=row["id"],
        agentId=row["agent_id"],
        agentName=row["agent_name"],
        proposedAction=row["proposed_action"],
        completedActions=completed_actions,
        status=row["status"],
        comment=row.get("comment"),
        createdAt=row["created_at"],
    )


def _command_from_row(row: dict[str, Any]) -> CommandResponse:
    return CommandResponse(
        id=row["id"],
        agentId=row["agent_id"],
        kind=row["kind"],
        payload=row.get("payload") or {},
        status=row["status"],
        createdAt=row["created_at"],
        sourceTaskId=row.get("source_task_id"),
        sourceMessageId=row.get("source_message_id"),
    )


def _comms_message_from_row(row: dict[str, Any]) -> CommsMessageResponse:
    metadata = row.get("metadata") or {}
    if not isinstance(metadata, dict):
        metadata = {}
    return CommsMessageResponse(
        id=row["id"],
        agentId=row["agent_id"],
        sender=row["sender"],
        content=row["content"],
        messageStatus=row["message_status"],
        replyToMessageId=row.get("reply_to_message_id"),
        metadata=metadata,
        createdAt=row["created_at"],
        deliveredAt=row.get("delivered_at"),
        respondedAt=row.get("responded_at"),
    )


def _require_agent_id(
    connection: Connection[dict[str, Any]],
    x_agent_token: str | None,
) -> UUID:
    if not x_agent_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Agent-Token header.",
        )

    token_hash = hash_agent_token(x_agent_token)
    row = connection.execute(
        """
        select agent_id
        from agent_tokens
        where token_hash = %s and revoked_at is null
        """,
        (token_hash,),
    ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked agent token.",
        )
    return row["agent_id"]


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be Bearer <token>.",
        )
    return token.strip()


def _get_issuer_base_url(token: str) -> str | None:
    try:
        payload = jwt.decode(
            token,
            options={
                "verify_signature": False,
                "verify_exp": False,
                "verify_aud": False,
            },
        )
    except jwt.InvalidTokenError:
        return None

    issuer = payload.get("iss")
    if not isinstance(issuer, str) or not issuer:
        return None

    # Supabase typically issues tokens with iss=https://<ref>.supabase.co/auth/v1
    # and JWKS available at /auth/v1/.well-known/jwks.json.
    issuer_base = issuer.split("/auth/v1", 1)[0]
    parsed = urlparse(issuer_base)
    if not parsed.scheme or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")


def _decode_with_supabase_jwks(token: str) -> dict[str, Any] | None:
    global _warned_missing_cryptography

    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError:
        return None

    algorithm = header.get("alg")
    if not isinstance(algorithm, str) or algorithm.upper().startswith("HS"):
        return None
    if algorithm.upper().startswith("ES") and _cryptography is None:
        if not _warned_missing_cryptography:
            logger.warning(
                "cryptography package is missing; ES256/ES* JWT verification is unavailable. "
                "Install backend requirements to enable Supabase asymmetric token verification."
            )
            _warned_missing_cryptography = True
        return None

    issuer_base = _get_issuer_base_url(token)
    if issuer_base is None:
        return None

    jwks_url = f"{issuer_base}/auth/v1/.well-known/jwks.json"
    jwks_client = _jwks_clients.get(jwks_url)
    if jwks_client is None:
        ssl_ctx = ssl.create_default_context(cafile=certifi.where())
        jwks_client = PyJWKClient(jwks_url, ssl_context=ssl_ctx)
        _jwks_clients[jwks_url] = jwks_client

    signing_key = jwks_client.get_signing_key_from_jwt(token).key
    try:
        return jwt.decode(
            token,
            signing_key,
            algorithms=[algorithm],
            options={"verify_aud": False},
        )
    except jwt.InvalidTokenError as e:
        logger.warning("JWKS jwt.decode failed: %s: %s", e.__class__.__name__, e)
        return None


def _decode_user_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        raise
    except jwt.InvalidTokenError as hs_error:
        try:
            jwks_payload = _decode_with_supabase_jwks(token)
        except (jwt.InvalidTokenError, PyJWKClientError) as jwks_error:
            logger.warning("JWKS fallback failed: %s: %s", jwks_error.__class__.__name__, jwks_error)
            jwks_payload = None
        if jwks_payload is not None:
            return jwks_payload
        raise hs_error


def _require_user_auth(
    authorization: str | None = Header(default=None, alias="Authorization"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> AuthenticatedUser:
    token = _extract_bearer_token(authorization)
    try:
        payload = _decode_user_token(token)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as error:
        alg = "unknown"
        iss = "unknown"
        has_sub = False
        try:
            header = jwt.get_unverified_header(token)
            alg = str(header.get("alg", "unknown"))
        except jwt.InvalidTokenError:
            pass
        try:
            unverified_payload = jwt.decode(
                token,
                options={
                    "verify_signature": False,
                    "verify_exp": False,
                    "verify_aud": False,
                },
            )
            iss = str(unverified_payload.get("iss", "unknown"))
            has_sub = bool(unverified_payload.get("sub"))
        except jwt.InvalidTokenError:
            pass

        logger.warning(
            "User JWT rejected (%s): alg=%s iss=%s has_sub=%s",
            error.__class__.__name__,
            alg,
            iss,
            has_sub,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        logger.warning("User JWT rejected (missing sub claim).")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    # Validate sub as a valid UUID before querying database
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        logger.warning("User JWT rejected (non-UUID sub claim).")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    row = connection.execute(
        """
        select id, email, workspace_id
        from users
        where id = %s::uuid
        """,
        (user_id,),
    ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account not found.",
        )
    if row["workspace_id"] is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not assigned to a workspace.",
        )

    return AuthenticatedUser(
        id=row["id"],
        email=row["email"],
        workspace_id=row["workspace_id"],
    )


def _require_user_auth_sse(
    token: str | None = Query(default=None),
) -> AuthenticatedUser:
    """Validates a short-lived opaque SSE token issued by POST /v1/sse-token.

    Tokens are single-use and expire after _SSE_TOKEN_TTL seconds. The
    returned AuthenticatedUser is held for the lifetime of the SSE connection.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing SSE token.",
        )
    now = time.time()
    # Purge expired tokens opportunistically.
    expired = [t for t, (_, _, exp) in _sse_tokens.items() if exp < now]
    for t in expired:
        _sse_tokens.pop(t, None)

    entry = _sse_tokens.pop(token, None)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired SSE token.",
        )
    user_id, workspace_id, _ = entry
    return AuthenticatedUser(id=user_id, email="", workspace_id=workspace_id)


def _require_control_plane_auth(
    x_control_plane_token: str | None = Header(default=None, alias="X-Control-Plane-Token"),
) -> None:
    if verify_control_plane_token(x_control_plane_token, settings.control_plane_token):
        return
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing X-Control-Plane-Token.",
    )


def _fetch_agent(
    connection: Connection[dict[str, Any]],
    agent_id: UUID,
    workspace_id: UUID,
) -> AgentResponse:
    row = connection.execute(
        """
        select
          a.id,
          a.name,
          a.status,
          a.description,
          a.created_at,
          coalesce(sum(e.cost), 0)::float8 as total_spend,
          greatest(
            max(e.created_at),
            (select max(created_at) from commands where agent_id = a.id),
            (select max(created_at) from comms_messages where agent_id = a.id)
          ) as last_seen,
          count(e.id)::int as events_count,
          t.token_hash
        from agents a
        left join events e on e.agent_id = a.id
        left join agent_tokens t on t.agent_id = a.id and t.revoked_at is null
        where a.id = %s::uuid and a.workspace_id = %s::uuid
        group by a.id, a.name, a.status, a.description, a.created_at, t.token_hash
        """,
        (agent_id, workspace_id),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    return _agent_from_row(row)


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _sse_loop
    _sse_loop = asyncio.get_running_loop()
    init_db_pool(settings)
    try:
        yield
    finally:
        close_db_pool()
        _sse_loop = None


app = FastAPI(title="Jarvis Mission Control API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(psycopg.DataError)
def handle_data_error(_: Request, __: psycopg.DataError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Invalid value format for one or more fields."},
    )


@app.exception_handler(psycopg.errors.UniqueViolation)
def handle_unique_violation(_: Request, __: psycopg.errors.UniqueViolation) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Resource already exists."},
    )


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/sse-token")
def issue_sse_token(
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
) -> dict[str, str]:
    """Return a short-lived, single-use token for authenticating EventSource (SSE) connections.

    Tokens expire after _SSE_TOKEN_TTL seconds and are consumed on first use,
    so the JWT never appears in a URL or server access log.
    """
    token = secrets.token_urlsafe(32)
    _sse_tokens[token] = (auth_user.id, auth_user.workspace_id, time.time() + _SSE_TOKEN_TTL)
    return {"token": token}


@app.get("/v1/agents", response_model=list[AgentResponse])
def list_agents(
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[AgentResponse]:
    rows = connection.execute(
        """
        select
          a.id,
          a.name,
          a.status,
          a.description,
          a.created_at,
          coalesce(sum(e.cost), 0)::float8 as total_spend,
          greatest(
            max(e.created_at),
            (select max(created_at) from commands where agent_id = a.id),
            (select max(created_at) from comms_messages where agent_id = a.id)
          ) as last_seen,
          count(e.id)::int as events_count,
          t.token_hash
        from agents a
        left join events e on e.agent_id = a.id
        left join agent_tokens t on t.agent_id = a.id and t.revoked_at is null
        where a.workspace_id = %s::uuid
        group by a.id, a.name, a.status, a.description, a.created_at, t.token_hash
        order by a.created_at desc
        """,
        (auth_user.workspace_id,),
    ).fetchall()
    return [_agent_from_row(row) for row in rows]


@app.post("/v1/agents", response_model=AgentCreateResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    payload: AgentCreateRequest,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> AgentCreateResponse:
    token = generate_agent_token()
    token_hash = hash_agent_token(token)

    created_agent = connection.execute(
        """
        insert into agents (owner_user_id, workspace_id, name, description, status)
        values (%s::uuid, %s::uuid, %s, %s, 'idle')
        returning id
        """,
        (auth_user.id, auth_user.workspace_id, payload.name.strip(), payload.description),
    ).fetchone()
    if created_agent is None:
        raise HTTPException(status_code=500, detail="Failed to create agent.")

    try:
        vault_key = _require_vault_key()
        encrypted = encrypt_secret(token, vault_key)
    except HTTPException:
        encrypted = None  # vault not configured — token stored hash-only

    connection.execute(
        """
        insert into agent_tokens (agent_id, token_hash, encrypted_token)
        values (%s::uuid, %s, %s)
        """,
        (created_agent["id"], token_hash, encrypted),
    )

    return AgentCreateResponse(
        agent=_fetch_agent(connection, created_agent["id"], auth_user.workspace_id),
        agentToken=token,
    )


@app.get("/v1/agents/{agent_id}", response_model=AgentResponse)
def get_agent(
    agent_id: UUID,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> AgentResponse:
    return _fetch_agent(connection, agent_id, auth_user.workspace_id)


@app.patch("/v1/agents/{agent_id}/status", response_model=AgentResponse)
def update_agent_status(
    agent_id: UUID,
    payload: AgentStatusUpdateRequest,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> AgentResponse:
    updated = connection.execute(
        """
        update agents
        set status = %s
        where id = %s::uuid and workspace_id = %s::uuid
        returning id
        """,
        (payload.status, agent_id, auth_user.workspace_id),
    ).fetchone()
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    return _fetch_agent(connection, agent_id, auth_user.workspace_id)


@app.delete(
    "/v1/agents/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_agent(
    agent_id: UUID,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> Response:
    deleted = connection.execute(
        """
        delete from agents
        where id = %s::uuid and workspace_id = %s::uuid
        returning id
        """,
        (agent_id, auth_user.workspace_id),
    ).fetchone()
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    "/v1/agents/{agent_id}/revoke-token",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def revoke_agent_token(
    agent_id: UUID,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> Response:
    exists = connection.execute(
        """
        select 1
        from agents
        where id = %s::uuid and workspace_id = %s::uuid
        """,
        (agent_id, auth_user.workspace_id),
    ).fetchone()
    if exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    connection.execute(
        """
        update agent_tokens
        set revoked_at = now()
        where agent_id = %s::uuid and revoked_at is null
        """,
        (agent_id,),
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/v1/agents/{agent_id}/reveal-token", response_model=AgentTokenRevealResponse)
def reveal_agent_token(
    agent_id: UUID,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> AgentTokenRevealResponse:
    """Return the decrypted plaintext agent token. Requires vault encryption to be configured."""
    vault_key = _require_vault_key()

    row = connection.execute(
        """
        select t.encrypted_token
        from agent_tokens t
        join agents a on a.id = t.agent_id
        where t.agent_id = %s::uuid
          and a.workspace_id = %s::uuid
          and t.revoked_at is null
        """,
        (agent_id, auth_user.workspace_id),
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    if row["encrypted_token"] is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token was created before encrypted storage was enabled. Revoke and regenerate to enable reveal.",
        )

    plaintext = decrypt_secret(bytes(row["encrypted_token"]), vault_key)
    return AgentTokenRevealResponse(agentId=agent_id, token=plaintext)


@app.get("/v1/agents/{agent_id}/events", response_model=list[AgentEventResponse])
def get_agent_events(
    agent_id: UUID,
    limit: int = Query(default=100, ge=1, le=500),
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[AgentEventResponse]:
    rows = connection.execute(
        """
        select
          e.id,
          e.agent_id,
          e.type,
          e.message,
          e.cost,
          e.created_at
        from events e
        join agents a on a.id = e.agent_id
        where e.agent_id = %s::uuid
          and a.workspace_id = %s::uuid
        order by e.created_at desc
        limit %s
        """,
        (agent_id, auth_user.workspace_id, limit),
    ).fetchall()
    return [_event_from_row(row) for row in rows]


@app.get("/v1/events", response_model=list[AgentEventResponse])
def list_events(
    limit: int = Query(default=50, ge=1, le=500),
    agentId: UUID | None = Query(default=None),
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[AgentEventResponse]:
    if agentId:
        rows = connection.execute(
            """
            select
              e.id,
              e.agent_id,
              e.type,
              e.message,
              e.cost,
              e.created_at
            from events e
            join agents a on a.id = e.agent_id
            where e.agent_id = %s::uuid
              and a.workspace_id = %s::uuid
            order by e.created_at desc
            limit %s
            """,
            (agentId, auth_user.workspace_id, limit),
        ).fetchall()
    else:
        rows = connection.execute(
            """
            select
              e.id,
              e.agent_id,
              e.type,
              e.message,
              e.cost,
              e.created_at
            from events e
            join agents a on a.id = e.agent_id
            where a.workspace_id = %s::uuid
            order by e.created_at desc
            limit %s
            """,
            (auth_user.workspace_id, limit),
        ).fetchall()

    return [_event_from_row(row) for row in rows]


@app.post("/v1/events", response_model=EventIngestResponse, status_code=status.HTTP_201_CREATED)
def ingest_event(
    payload: EventIngestRequest,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> EventIngestResponse:
    agent_id = _require_agent_id(connection, x_agent_token)
    
    # Fetch agent's workspace_id
    agent_row = connection.execute(
        "select workspace_id from agents where id = %s::uuid",
        (agent_id,),
    ).fetchone()
    if agent_row is None:
        raise HTTPException(status_code=404, detail="Agent not found.")
    agent_workspace_id = agent_row["workspace_id"]

    # Enforce budget cap: reject events with cost if workspace is at or over budget
    if payload.cost and payload.cost > 0:
        budget_row = connection.execute(
            "select monthly_budget from users where workspace_id = %s::uuid limit 1",
            (agent_workspace_id,),
        ).fetchone()
        if budget_row is not None:
            monthly_budget = float(budget_row["monthly_budget"] or 0)
            if monthly_budget > 0:
                monthly_spend_row = connection.execute(
                    """
                    select coalesce(sum(e.cost), 0)::float8 as monthly
                    from events e
                    join agents a on a.id = e.agent_id
                    where a.workspace_id = %s::uuid
                      and e.created_at >= date_trunc('month', now())
                    """,
                    (agent_workspace_id,),
                ).fetchone()
                monthly_spend = float((monthly_spend_row or {}).get("monthly") or 0)
                if monthly_spend >= monthly_budget:
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail="Budget cap reached. No further spend is permitted until the workspace owner resets the budget.",
                    )

    proposed_action = payload.proposedAction if payload.requiresApproval else None

    event_row = connection.execute(
        """
        insert into events (
          agent_id,
          workspace_id,
          type,
          message,
          cost,
          requires_approval,
          proposed_action,
          completed_actions
        )
        values (%s::uuid, %s::uuid, %s, %s, %s, %s, %s, %s)
        returning
          id,
          agent_id,
          type,
          message,
          cost,
          created_at
        """,
        (
            agent_id,
            agent_workspace_id,
            payload.type,
            payload.message,
            payload.cost,
            payload.requiresApproval,
            proposed_action,
            Jsonb(payload.completedActions),
        ),
    ).fetchone()
    if event_row is None:
        raise HTTPException(status_code=500, detail="Failed to ingest event.")

    connection.execute(
        """
        update agents
        set last_seen_at = now()
        where id = %s::uuid
        """,
        (agent_id,),
    )

    task_id: UUID | None = None
    if payload.requiresApproval:
        if not payload.proposedAction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="proposedAction is required when requiresApproval is true.",
            )
        task_row = connection.execute(
            """
            insert into tasks (agent_id, workspace_id, proposed_action, completed_actions, status)
            values (%s::uuid, %s::uuid, %s, %s, 'pending')
            returning id
            """,
            (agent_id, agent_workspace_id, payload.proposedAction, Jsonb(payload.completedActions)),
        ).fetchone()
        if task_row is None:
            raise HTTPException(status_code=500, detail="Failed to create approval task.")
        task_id = task_row["id"]
        connection.execute(
            """
            update agents
            set status = 'waiting_approval'
            where id = %s::uuid
            """,
            (agent_id,),
        )

    _sse_publish(f"events:{agent_workspace_id}", str(agent_id))
    _sse_publish(f"spend:{agent_workspace_id}")
    if payload.requiresApproval:
        _sse_publish(f"inbox:{agent_workspace_id}")

    return EventIngestResponse(event=_event_from_row(event_row), taskId=task_id)


@app.post("/v1/webhook/{agent_token}", include_in_schema=False)
def webhook_legacy_redirect(agent_token: str) -> None:  # noqa: ARG001
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail=(
            "This webhook URL format is no longer supported. "
            "Use POST /v1/webhook with the X-Agent-Token header instead. "
            "See the Docs page in your dashboard for updated examples."
        ),
    )


@app.post("/v1/webhook", response_model=WebhookEventResponse, status_code=status.HTTP_201_CREATED)
def webhook_ingest_event(
    payload: WebhookEventRequest,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> WebhookEventResponse:
    agent_id = _require_agent_id(connection, x_agent_token)

    agent_row = connection.execute(
        "select workspace_id from agents where id = %s::uuid",
        (agent_id,),
    ).fetchone()
    if agent_row is None:
        raise HTTPException(status_code=404, detail="Agent not found.")

    event_row = connection.execute(
        """
        insert into events (
          agent_id,
          workspace_id,
          type,
          message,
          cost,
          requires_approval,
          proposed_action,
          completed_actions
        )
        values (%s::uuid, %s::uuid, %s, %s, %s, false, null, %s)
        returning id
        """,
        (
            agent_id,
            agent_row["workspace_id"],
            payload.type,
            payload.message,
            payload.cost,
            Jsonb([]),
        ),
    ).fetchone()
    if event_row is None:
        raise HTTPException(status_code=500, detail="Failed to ingest event.")

    connection.execute(
        "update agents set last_seen_at = now() where id = %s::uuid",
        (agent_id,),
    )

    return WebhookEventResponse(ok=True, eventId=event_row["id"])


@app.get("/v1/inbox", response_model=list[InboxItemResponse])
def list_inbox(
    status_filter: InboxStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[InboxItemResponse]:
    if status_filter:
        rows = connection.execute(
            """
            select
              t.id,
              t.agent_id,
              a.name as agent_name,
              t.proposed_action,
              t.completed_actions,
              t.status,
              t.comment,
              t.created_at
            from tasks t
            join agents a on a.id = t.agent_id
            where t.status = %s
              and a.workspace_id = %s::uuid
            order by t.created_at desc
            limit %s
            """,
            (status_filter, auth_user.workspace_id, limit),
        ).fetchall()
    else:
        rows = connection.execute(
            """
            select
              t.id,
              t.agent_id,
              a.name as agent_name,
              t.proposed_action,
              t.completed_actions,
              t.status,
              t.comment,
              t.created_at
            from tasks t
            join agents a on a.id = t.agent_id
            where a.workspace_id = %s::uuid
            order by
              case when t.status = 'pending' then 0 else 1 end,
              t.created_at desc
            limit %s
            """,
            (auth_user.workspace_id, limit),
        ).fetchall()

    return [_inbox_from_row(row) for row in rows]


@app.post("/v1/inbox/{item_id}/decision", response_model=InboxItemResponse)
def decide_inbox_item(
    item_id: UUID,
    payload: InboxDecisionRequest,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> InboxItemResponse:
    with connection.transaction():
        task_row = connection.execute(
            """
            update tasks t
            set status = %s, comment = %s, decided_at = now()
            from agents a
            where t.id = %s::uuid
              and t.status = 'pending'
              and a.id = t.agent_id
              and a.workspace_id = %s::uuid
            returning t.id, t.agent_id
            """,
            (payload.decision, payload.comment, item_id, auth_user.workspace_id),
        ).fetchone()

        if task_row is None:
            existing = connection.execute(
                """
                select t.status
                from tasks t
                join agents a on a.id = t.agent_id
                where t.id = %s::uuid
                  and a.workspace_id = %s::uuid
                """,
                (item_id, auth_user.workspace_id),
            ).fetchone()
            if existing is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Inbox item not found.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inbox item already decided.",
            )

        # Fetch agent's workspace_id for the command insert
        agent_workspace_row = connection.execute(
            "select workspace_id from agents where id = %s::uuid",
            (task_row["agent_id"],),
        ).fetchone()
        agent_workspace_id = agent_workspace_row["workspace_id"] if agent_workspace_row else None

        command_row = connection.execute(
            """
            insert into commands (agent_id, workspace_id, source_task_id, kind, payload, status)
            values (%s::uuid, %s::uuid, %s::uuid, 'approval_decision', %s, 'pending')
            on conflict do nothing
            returning id
            """,
            (
                task_row["agent_id"],
                agent_workspace_id,
                item_id,
                Jsonb({"decision": payload.decision, "comment": payload.comment}),
            ),
        ).fetchone()
        if command_row is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A decision command already exists for this inbox item.",
            )

        _sse_publish(f"commands:{task_row['agent_id']}")

        pending_count_row = connection.execute(
            """
            select count(*)::int as pending_count
            from tasks
            where agent_id = %s::uuid and status = 'pending'
            """,
            (task_row["agent_id"],),
        ).fetchone()
        pending_count = int((pending_count_row or {}).get("pending_count", 0))

        connection.execute(
            """
            update agents
            set status = %s
            where id = %s::uuid
            """,
            ("waiting_approval" if pending_count > 0 else "running", task_row["agent_id"]),
        )

    updated_row = connection.execute(
        """
        select
          t.id,
          t.agent_id,
          a.name as agent_name,
          t.proposed_action,
          t.completed_actions,
          t.status,
          t.comment,
          t.created_at
        from tasks t
        join agents a on a.id = t.agent_id
        where t.id = %s::uuid
          and a.workspace_id = %s::uuid
        """,
        (item_id, auth_user.workspace_id),
    ).fetchone()
    if updated_row is None:
        raise HTTPException(status_code=500, detail="Failed to load updated inbox item.")
    return _inbox_from_row(updated_row)


@app.get("/v1/spend", response_model=SpendResponse)
def get_spend(
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> SpendResponse:
    user = connection.execute(
        """
        select id, monthly_budget
        from users
        where id = %s::uuid and workspace_id = %s::uuid
        """,
        (auth_user.id, auth_user.workspace_id),
    ).fetchone()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    daily_row = connection.execute(
        """
        select coalesce(sum(e.cost), 0)::float8 as daily
        from events e
        join agents a on a.id = e.agent_id
        where a.workspace_id = %s::uuid
          and e.created_at >= date_trunc('day', now())
        """,
        (auth_user.workspace_id,),
    ).fetchone()
    monthly_row = connection.execute(
        """
        select coalesce(sum(e.cost), 0)::float8 as monthly
        from events e
        join agents a on a.id = e.agent_id
        where a.workspace_id = %s::uuid
          and e.created_at >= date_trunc('month', now())
        """,
        (auth_user.workspace_id,),
    ).fetchone()
    breakdown_rows = connection.execute(
        """
        select
          a.id as agent_id,
          a.name as agent_name,
          coalesce(sum(e.cost), 0)::float8 as spend
        from agents a
        left join events e on e.agent_id = a.id
          and e.created_at >= date_trunc('month', now())
        where a.workspace_id = %s::uuid
        group by a.id, a.name
        order by spend desc, a.name asc
        """,
        (auth_user.workspace_id,),
    ).fetchall()

    return SpendResponse(
        daily=_to_float((daily_row or {}).get("daily", 0)),
        monthly=_to_float((monthly_row or {}).get("monthly", 0)),
        budget=_to_float(user["monthly_budget"]),
        agentBreakdown=[
            {
                "agentId": row["agent_id"],
                "agentName": row["agent_name"],
                "spend": _to_float(row["spend"]),
            }
            for row in breakdown_rows
        ],
    )


@app.patch("/v1/spend/budget", response_model=SpendResponse)
def update_budget(
    payload: BudgetUpdateRequest,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> SpendResponse:
    updated = connection.execute(
        """
        update users
        set monthly_budget = %s
        where id = %s::uuid and workspace_id = %s::uuid
        returning id
        """,
        (payload.budget, auth_user.id, auth_user.workspace_id),
    ).fetchone()
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    _sse_publish(f"spend:{auth_user.workspace_id}")
    return get_spend(auth_user=auth_user, connection=connection)


@app.get("/v1/commands", response_model=list[CommandResponse])
def get_commands(
    since: datetime | None = Query(default=None),
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[CommandResponse]:
    agent_id = _require_agent_id(connection, x_agent_token)

    if since:
        rows = connection.execute(
            """
            select
              id,
              agent_id,
              kind,
              payload,
              status,
              created_at,
              source_task_id,
              source_message_id
            from commands
            where agent_id = %s::uuid
              and status = 'pending'
              and created_at >= %s
            order by created_at asc
            """,
            (agent_id, since),
        ).fetchall()
    else:
        rows = connection.execute(
            """
            select
              id,
              agent_id,
              kind,
              payload,
              status,
              created_at,
              source_task_id,
              source_message_id
            from commands
            where agent_id = %s::uuid
              and status = 'pending'
            order by created_at asc
            """,
            (agent_id,),
        ).fetchall()

    return [_command_from_row(row) for row in rows]


@app.get("/v1/commands/listen", response_model=list[CommandResponse])
async def listen_for_commands(
    timeout: int = Query(default=30, ge=1, le=60),
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
) -> list[CommandResponse]:
    """Long-poll: holds the connection until a command arrives or timeout expires.
    The DB connection is released while waiting — zero idle DB cost."""
    pool = get_db_pool()

    # Phase 1: auth + check for already-pending commands, then release connection
    with pool.connection() as conn:
        agent_id = _require_agent_id(conn, x_agent_token)
        rows = conn.execute(
            """
            select id, agent_id, kind, payload, status, created_at,
                   source_task_id, source_message_id
            from commands
            where agent_id = %s::uuid and status = 'pending'
            order by created_at asc
            """,
            (agent_id,),
        ).fetchall()

    if rows:
        return [_command_from_row(row) for row in rows]

    # Phase 2: wait for a signal — no DB connection held during the wait
    channel = f"commands:{agent_id}"
    q: asyncio.Queue[str] = asyncio.Queue()
    _sse_queues[channel].append(q)
    try:
        await asyncio.wait_for(q.get(), timeout=float(timeout))
    except asyncio.TimeoutError:
        pass
    finally:
        try:
            _sse_queues[channel].remove(q)
        except ValueError:
            pass

    # Phase 3: fetch after signal (or timeout) — new short-lived connection
    with pool.connection() as conn:
        rows = conn.execute(
            """
            select id, agent_id, kind, payload, status, created_at,
                   source_task_id, source_message_id
            from commands
            where agent_id = %s::uuid and status = 'pending'
            order by created_at asc
            """,
            (agent_id,),
        ).fetchall()
    return [_command_from_row(row) for row in rows]


@app.post("/v1/commands/{command_id}/ack", response_model=CommandResponse)
def acknowledge_command(
    command_id: UUID,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> CommandResponse:
    agent_id = _require_agent_id(connection, x_agent_token)
    row = connection.execute(
        """
        update commands
        set status = 'acked', acked_at = now()
        where id = %s::uuid and agent_id = %s::uuid
        returning
          id,
          agent_id,
          kind,
          payload,
          status,
          created_at,
          source_task_id,
          source_message_id
        """,
        (command_id, agent_id),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Command not found.")

    # If this is a human_message command, mark the linked comms message as delivered
    if row["kind"] == "human_message" and row.get("source_message_id"):
        connection.execute(
            """
            update comms_messages
            set message_status = 'delivered', delivered_at = now()
            where id = %s::uuid and message_status = 'queued'
            """,
            (row["source_message_id"],),
        )

    return _command_from_row(row)


# ============================================================================
# Comms Hub endpoints
# ============================================================================

@app.get("/v1/comms/agents", response_model=list[CommsAgentSummary])
def list_comms_agents(
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[CommsAgentSummary]:
    rows = connection.execute(
        """
        select
          a.id as agent_id,
          a.name as agent_name,
          a.status as agent_status,
          last_msg.content as last_message,
          last_msg.created_at as last_message_at,
          coalesce(queued.cnt, 0)::int as queued_count,
          coalesce(pending_approvals.cnt, 0)::int as pending_approval_count
        from agents a
        left join lateral (
          select content, created_at
          from comms_messages
          where agent_id = a.id
          order by created_at desc
          limit 1
        ) last_msg on true
        left join lateral (
          select count(*)::int as cnt
          from comms_messages
          where agent_id = a.id and sender = 'human' and message_status = 'queued'
        ) queued on true
        left join lateral (
          select count(*)::int as cnt
          from tasks
          where agent_id = a.id and status = 'pending'
        ) pending_approvals on true
        where a.workspace_id = %s::uuid
        order by last_msg.created_at desc nulls last, a.created_at desc
        """,
        (auth_user.workspace_id,),
    ).fetchall()

    return [
        CommsAgentSummary(
            agentId=row["agent_id"],
            agentName=row["agent_name"],
            agentStatus=row["agent_status"],
            lastMessage=row.get("last_message"),
            lastMessageAt=row.get("last_message_at"),
            queuedCount=int(row["queued_count"] or 0),
            pendingApprovalCount=int(row["pending_approval_count"] or 0),
        )
        for row in rows
    ]


@app.get("/v1/comms/agents/{agent_id}/messages", response_model=list[CommsMessageResponse])
def get_comms_messages(
    agent_id: UUID,
    limit: int = Query(default=100, ge=1, le=500),
    before: datetime | None = Query(default=None),
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[CommsMessageResponse]:
    # Verify agent belongs to workspace
    agent_check = connection.execute(
        "select 1 from agents where id = %s::uuid and workspace_id = %s::uuid",
        (agent_id, auth_user.workspace_id),
    ).fetchone()
    if agent_check is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    if before:
        rows = connection.execute(
            """
            select
              id, agent_id, sender, content, message_status,
              reply_to_message_id, metadata, created_at, delivered_at, responded_at
            from comms_messages
            where agent_id = %s::uuid and workspace_id = %s::uuid and created_at < %s
            order by created_at asc
            limit %s
            """,
            (agent_id, auth_user.workspace_id, before, limit),
        ).fetchall()
    else:
        rows = connection.execute(
            """
            select
              id, agent_id, sender, content, message_status,
              reply_to_message_id, metadata, created_at, delivered_at, responded_at
            from comms_messages
            where agent_id = %s::uuid and workspace_id = %s::uuid
            order by created_at asc
            limit %s
            """,
            (agent_id, auth_user.workspace_id, limit),
        ).fetchall()

    return [_comms_message_from_row(row) for row in rows]


@app.post(
    "/v1/comms/agents/{agent_id}/messages",
    response_model=CommsMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_comms_message(
    agent_id: UUID,
    payload: CommsSendRequest,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> CommsMessageResponse:
    # Verify agent belongs to workspace
    agent_check = connection.execute(
        "select 1 from agents where id = %s::uuid and workspace_id = %s::uuid",
        (agent_id, auth_user.workspace_id),
    ).fetchone()
    if agent_check is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    with connection.transaction():
        msg_row = connection.execute(
            """
            insert into comms_messages
              (workspace_id, agent_id, sender, content, message_status, metadata)
            values (%s::uuid, %s::uuid, 'human', %s, 'queued', %s)
            returning
              id, agent_id, sender, content, message_status,
              reply_to_message_id, metadata, created_at, delivered_at, responded_at
            """,
            (
                auth_user.workspace_id,
                agent_id,
                payload.content,
                Jsonb(payload.metadata),
            ),
        ).fetchone()
        if msg_row is None:
            raise HTTPException(status_code=500, detail="Failed to create message.")

        # Create corresponding command so the agent can poll and receive it
        connection.execute(
            """
            insert into commands
              (agent_id, workspace_id, source_message_id, kind, payload, status)
            values (%s::uuid, %s::uuid, %s::uuid, 'human_message', %s, 'pending')
            """,
            (
                agent_id,
                auth_user.workspace_id,
                msg_row["id"],
                Jsonb({"messageId": str(msg_row["id"]), "content": payload.content}),
            ),
        )

    _sse_publish(f"commands:{agent_id}")
    _sse_publish(f"comms:{auth_user.workspace_id}", '{"type":"update"}')
    return _comms_message_from_row(msg_row)


@app.post(
    "/v1/comms/replies",
    response_model=CommsMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_comms_reply(
    payload: CommsReplyRequest,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> CommsMessageResponse:
    agent_id = _require_agent_id(connection, x_agent_token)

    agent_row = connection.execute(
        "select workspace_id from agents where id = %s::uuid",
        (agent_id,),
    ).fetchone()
    if agent_row is None:
        raise HTTPException(status_code=404, detail="Agent not found.")
    workspace_id = agent_row["workspace_id"]

    # Validate reply_to_message belongs to this agent
    if payload.replyToMessageId:
        parent = connection.execute(
            """
            select 1 from comms_messages
            where id = %s::uuid and agent_id = %s::uuid
            """,
            (payload.replyToMessageId, agent_id),
        ).fetchone()
        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Referenced message not found for this agent.",
            )

    with connection.transaction():
        msg_row = connection.execute(
            """
            insert into comms_messages
              (workspace_id, agent_id, sender, content, message_status,
               reply_to_message_id, metadata)
            values (%s::uuid, %s::uuid, 'agent', %s, 'responded', %s, %s)
            returning
              id, agent_id, sender, content, message_status,
              reply_to_message_id, metadata, created_at, delivered_at, responded_at
            """,
            (
                workspace_id,
                agent_id,
                payload.content,
                payload.replyToMessageId,
                Jsonb(payload.metadata),
            ),
        ).fetchone()
        if msg_row is None:
            raise HTTPException(status_code=500, detail="Failed to create reply.")

        # Mark the parent human message as responded
        if payload.replyToMessageId:
            connection.execute(
                """
                update comms_messages
                set message_status = 'responded', responded_at = now()
                where id = %s::uuid and agent_id = %s::uuid
                  and message_status in ('queued', 'delivered')
                """,
                (payload.replyToMessageId, agent_id),
            )

    _sse_publish(f"comms:{workspace_id}", '{"type":"update"}')
    return _comms_message_from_row(msg_row)


@app.post("/v1/comms/typing", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def post_comms_typing(
    payload: CommsTypingRequest,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> Response:
    """Agent signals typing status to the dashboard. No DB write — ephemeral SSE signal only."""
    agent_id = _require_agent_id(connection, x_agent_token)
    workspace_row = connection.execute(
        "select workspace_id from agents where id = %s::uuid", (agent_id,)
    ).fetchone()
    if workspace_row is None:
        raise HTTPException(status_code=404, detail="Agent not found.")
    import json as _json
    _sse_publish(
        f"comms:{workspace_row['workspace_id']}",
        _json.dumps({"type": "typing", "agentId": str(agent_id), "isTyping": payload.isTyping}),
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/v1/comms/stream", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def post_comms_stream_chunk(
    payload: CommsStreamChunkRequest,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> Response:
    """Agent streams a token chunk to the dashboard. No DB write — ephemeral SSE only."""
    agent_id = _require_agent_id(connection, x_agent_token)
    workspace_row = connection.execute(
        "select workspace_id from agents where id = %s::uuid", (agent_id,)
    ).fetchone()
    if workspace_row is None:
        raise HTTPException(status_code=404, detail="Agent not found.")
    import json as _json
    _sse_publish(
        f"comms:{workspace_row['workspace_id']}",
        _json.dumps({"type": "chunk", "agentId": str(agent_id), "content": payload.content}),
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ============================================================================
# SSE streaming endpoints
# ============================================================================

_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "Connection": "keep-alive",
}


async def _sse_generator(channel: str, filter_data: str | None = None):
    """Yield SSE frames for *channel*; sends a keepalive comment every 30 s."""
    q: asyncio.Queue[str] = asyncio.Queue()
    _sse_queues[channel].append(q)
    try:
        yield "data: connected\n\n"
        while True:
            try:
                data = await asyncio.wait_for(q.get(), timeout=30.0)
                if filter_data is None or data == filter_data:
                    yield f"data: {data}\n\n"
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"
    finally:
        try:
            _sse_queues[channel].remove(q)
        except ValueError:
            pass


@app.get("/v1/stream/events")
async def stream_events(
    agent_id: str | None = Query(default=None),
    auth_user: AuthenticatedUser = Depends(_require_user_auth_sse),
) -> StreamingResponse:
    return StreamingResponse(
        _sse_generator(f"events:{auth_user.workspace_id}", filter_data=agent_id),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


@app.get("/v1/stream/comms")
async def stream_comms(
    auth_user: AuthenticatedUser = Depends(_require_user_auth_sse),
) -> StreamingResponse:
    return StreamingResponse(
        _sse_generator(f"comms:{auth_user.workspace_id}"),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


@app.get("/v1/stream/inbox")
async def stream_inbox(
    auth_user: AuthenticatedUser = Depends(_require_user_auth_sse),
) -> StreamingResponse:
    return StreamingResponse(
        _sse_generator(f"inbox:{auth_user.workspace_id}"),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


@app.get("/v1/stream/spend")
async def stream_spend(
    auth_user: AuthenticatedUser = Depends(_require_user_auth_sse),
) -> StreamingResponse:
    return StreamingResponse(
        _sse_generator(f"spend:{auth_user.workspace_id}"),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


# ============================================================================
# Workshop endpoints
# ============================================================================

def _workshop_task_from_row(row: dict[str, Any]) -> WorkshopTaskResponse:
    return WorkshopTaskResponse(
        id=row["id"],
        workspaceId=row["workspace_id"],
        agentId=row.get("agent_id"),
        agentName=row.get("agent_name"),
        title=row["title"],
        description=row.get("description"),
        status=row["status"],
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


_WORKSHOP_SELECT = """
    select
      wt.id,
      wt.workspace_id,
      wt.agent_id,
      a.name as agent_name,
      wt.title,
      wt.description,
      wt.status,
      wt.created_at,
      wt.updated_at
    from workshop_tasks wt
    left join agents a on a.id = wt.agent_id
"""


@app.get("/v1/workshop/tasks", response_model=list[WorkshopTaskResponse])
def list_workshop_tasks(
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[WorkshopTaskResponse]:
    rows = connection.execute(
        _WORKSHOP_SELECT + """
        where wt.workspace_id = %s::uuid
        order by
          case wt.status when 'backlog' then 0 when 'in_progress' then 1 else 2 end,
          wt.created_at asc
        """,
        (auth_user.workspace_id,),
    ).fetchall()
    return [_workshop_task_from_row(row) for row in rows]


@app.post("/v1/workshop/tasks", response_model=WorkshopTaskResponse, status_code=status.HTTP_201_CREATED)
def create_workshop_task(
    payload: WorkshopTaskCreateRequest,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> WorkshopTaskResponse:
    if payload.agentId:
        agent_check = connection.execute(
            "select 1 from agents where id = %s::uuid and workspace_id = %s::uuid",
            (payload.agentId, auth_user.workspace_id),
        ).fetchone()
        if agent_check is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    row = connection.execute(
        """
        insert into workshop_tasks (workspace_id, agent_id, created_by, title, description, status)
        values (%s::uuid, %s, %s::uuid, %s, %s, 'backlog')
        returning id
        """,
        (auth_user.workspace_id, payload.agentId, auth_user.id, payload.title.strip(), payload.description),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=500, detail="Failed to create task.")

    full_row = connection.execute(
        _WORKSHOP_SELECT + " where wt.id = %s::uuid",
        (row["id"],),
    ).fetchone()
    if full_row is None:
        raise HTTPException(status_code=500, detail="Failed to load created task.")
    return _workshop_task_from_row(full_row)


@app.patch("/v1/workshop/tasks/{task_id}", response_model=WorkshopTaskResponse)
def update_workshop_task(
    task_id: UUID,
    payload: WorkshopTaskUpdateRequest,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> WorkshopTaskResponse:
    existing = connection.execute(
        "select id, title, description, status, agent_id from workshop_tasks where id = %s::uuid and workspace_id = %s::uuid",
        (task_id, auth_user.workspace_id),
    ).fetchone()
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    # Resolve new agent_id: None in payload means "unset field", so we need a sentinel
    new_agent_id = existing["agent_id"]
    if "agentId" in payload.model_fields_set:
        if payload.agentId is not None:
            agent_check = connection.execute(
                "select 1 from agents where id = %s::uuid and workspace_id = %s::uuid",
                (payload.agentId, auth_user.workspace_id),
            ).fetchone()
            if agent_check is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
        new_agent_id = payload.agentId

    connection.execute(
        """
        update workshop_tasks
        set
          title = %s,
          description = %s,
          status = %s,
          agent_id = %s,
          updated_at = now()
        where id = %s::uuid and workspace_id = %s::uuid
        """,
        (
            payload.title.strip() if payload.title else existing["title"],
            payload.description if payload.description is not None else existing["description"],
            payload.status or existing["status"],
            new_agent_id,
            task_id,
            auth_user.workspace_id,
        ),
    )

    full_row = connection.execute(
        _WORKSHOP_SELECT + " where wt.id = %s::uuid",
        (task_id,),
    ).fetchone()
    if full_row is None:
        raise HTTPException(status_code=500, detail="Failed to load updated task.")
    return _workshop_task_from_row(full_row)


@app.delete(
    "/v1/workshop/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_workshop_task(
    task_id: UUID,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> Response:
    deleted = connection.execute(
        "delete from workshop_tasks where id = %s::uuid and workspace_id = %s::uuid returning id",
        (task_id, auth_user.workspace_id),
    ).fetchone()
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Agent-facing workshop endpoints ──────────────────────────────────────────

@app.get("/v1/workshop/my-tasks", response_model=list[WorkshopTaskResponse])
def get_my_workshop_tasks(
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[WorkshopTaskResponse]:
    """Return backlog + in-progress tasks assigned to this agent, prioritised by status."""
    agent_id = _require_agent_id(connection, x_agent_token)
    rows = connection.execute(
        _WORKSHOP_SELECT + """
        where wt.agent_id = %s::uuid
          and wt.status in ('backlog', 'in_progress')
        order by
          case wt.status when 'in_progress' then 0 else 1 end,
          wt.created_at asc
        """,
        (agent_id,),
    ).fetchall()
    return [_workshop_task_from_row(row) for row in rows]


@app.patch("/v1/workshop/my-tasks/{task_id}/status", response_model=WorkshopTaskResponse)
def update_my_workshop_task_status(
    task_id: UUID,
    payload: WorkshopTaskStatusUpdateRequest,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> WorkshopTaskResponse:
    """Allow an agent to move a task assigned to it through statuses."""
    agent_id = _require_agent_id(connection, x_agent_token)

    updated = connection.execute(
        """
        update workshop_tasks
        set status = %s, updated_at = now()
        where id = %s::uuid and agent_id = %s::uuid
        returning id
        """,
        (payload.status, task_id, agent_id),
    ).fetchone()
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or not assigned to this agent.",
        )

    full_row = connection.execute(
        _WORKSHOP_SELECT + " where wt.id = %s::uuid",
        (task_id,),
    ).fetchone()
    if full_row is None:
        raise HTTPException(status_code=500, detail="Failed to load updated task.")
    return _workshop_task_from_row(full_row)


# ============================================================================
# Key Vault endpoints
# ============================================================================

def _require_vault_key() -> str:
    """Return the Fernet encryption key or raise 503 if not configured."""
    key = settings.vault_encryption_key
    if not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Key Vault is not configured. "
                "Set the VAULT_ENCRYPTION_KEY environment variable. "
                "Generate one with: python -c \"from app.security import generate_vault_key; print(generate_vault_key())\""
            ),
        )
    return key


def _vault_secret_from_row(row: dict[str, Any], plaintext: str) -> VaultSecretResponse:
    return VaultSecretResponse(
        id=row["id"],
        name=row["name"],
        keyName=row["key_name"],
        preview=mask_secret_value(plaintext),
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


@app.get("/v1/vault/secrets", response_model=list[VaultSecretResponse])
def list_vault_secrets(
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[VaultSecretResponse]:
    """List all secrets for the workspace. Values are never returned — only masked previews."""
    vault_key = _require_vault_key()
    rows = connection.execute(
        """
        select id, name, key_name, encrypted_value, created_at, updated_at
        from vault_secrets
        where workspace_id = %s::uuid
        order by name asc
        """,
        (auth_user.workspace_id,),
    ).fetchall()

    result = []
    for row in rows:
        try:
            plaintext = decrypt_secret(bytes(row["encrypted_value"]), vault_key)
        except Exception:
            plaintext = ""  # decryption failure → show empty preview
        result.append(_vault_secret_from_row(row, plaintext))
    return result


@app.post("/v1/vault/secrets", response_model=VaultSecretResponse, status_code=status.HTTP_201_CREATED)
def create_vault_secret(
    payload: VaultSecretCreateRequest,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> VaultSecretResponse:
    """Store a new secret, encrypted at rest. Plaintext is never persisted."""
    vault_key = _require_vault_key()
    key_name = payload.keyName.upper()

    try:
        ciphertext = encrypt_secret(payload.value, vault_key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Encryption failed: {exc}") from exc

    try:
        row = connection.execute(
            """
            insert into vault_secrets (workspace_id, name, key_name, encrypted_value, created_by)
            values (%s::uuid, %s, %s, %s, %s::uuid)
            returning id, name, key_name, encrypted_value, created_at, updated_at
            """,
            (auth_user.workspace_id, payload.name.strip(), key_name, ciphertext, auth_user.id),
        ).fetchone()
    except psycopg.errors.UniqueViolation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A secret with key name '{key_name}' already exists.",
        )

    if row is None:
        raise HTTPException(status_code=500, detail="Failed to create secret.")
    return _vault_secret_from_row(row, payload.value)


@app.get("/v1/vault/secrets/{secret_id}/reveal", response_model=VaultSecretRevealResponse)
def reveal_vault_secret(
    secret_id: UUID,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> VaultSecretRevealResponse:
    """Return the decrypted plaintext value for a single secret. Use sparingly."""
    vault_key = _require_vault_key()
    row = connection.execute(
        """
        select id, key_name, encrypted_value
        from vault_secrets
        where id = %s::uuid and workspace_id = %s::uuid
        """,
        (secret_id, auth_user.workspace_id),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secret not found.")

    try:
        plaintext = decrypt_secret(bytes(row["encrypted_value"]), vault_key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Decryption failed — key mismatch?") from exc

    return VaultSecretRevealResponse(id=row["id"], keyName=row["key_name"], value=plaintext)


@app.delete(
    "/v1/vault/secrets/{secret_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_vault_secret(
    secret_id: UUID,
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> Response:
    deleted = connection.execute(
        "delete from vault_secrets where id = %s::uuid and workspace_id = %s::uuid returning id",
        (secret_id, auth_user.workspace_id),
    ).fetchone()
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secret not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Agent-facing vault endpoint ───────────────────────────────────────────────

@app.get("/v1/vault/my-secrets/{key_name}")
def get_agent_secret(
    key_name: str,
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> dict[str, str]:
    """
    Agent endpoint: retrieve a secret value by key name.
    Returns the plaintext value so agents can inject it into their environment.
    """
    vault_key = _require_vault_key()
    agent_id = _require_agent_id(connection, x_agent_token)

    # Agents can only access secrets belonging to their workspace
    agent_row = connection.execute(
        "select workspace_id from agents where id = %s::uuid",
        (agent_id,),
    ).fetchone()
    if agent_row is None:
        raise HTTPException(status_code=404, detail="Agent not found.")

    row = connection.execute(
        """
        select encrypted_value
        from vault_secrets
        where workspace_id = %s::uuid and key_name = %s
        """,
        (agent_row["workspace_id"], key_name.upper()),
    ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Secret '{key_name}' not found.",
        )

    try:
        plaintext = decrypt_secret(bytes(row["encrypted_value"]), vault_key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Decryption failed.") from exc

    return {"key": key_name.upper(), "value": plaintext}


# ── HTTP MCP transport ─────────────────────────────────────────────────────────
# Implements MCP Streamable HTTP (JSON-RPC 2.0 over POST).
# Connect with: claude mcp add --transport http jarvis https://your-jarvis.com/mcp?token=YOUR_TOKEN

_MCP_TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "log_action",
        "description": (
            "Log a significant action or milestone to the Jarvis Mission Control dashboard. "
            "Use this for important steps, completed tasks, or notable events — "
            "not routine file reads, searches, or minor operations."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "What you did or are doing"},
                "cost": {
                    "type": "number",
                    "description": "Estimated USD cost incurred (0 if unknown or not applicable)",
                    "default": 0,
                },
                "type": {
                    "type": "string",
                    "enum": ["action", "completion", "error", "tool_call"],
                    "description": "Event type",
                    "default": "action",
                },
            },
            "required": ["message"],
        },
    },
    {
        "name": "request_approval",
        "description": (
            "Request human approval before proceeding with a significant, irreversible, or risky action. "
            "BLOCKS until the human approves or rejects in the Jarvis dashboard inbox. "
            "Always call this before: deleting files or data, pushing code, sending emails or messages, "
            "making purchases, modifying production systems, or any action that cannot be undone. "
            "Returns the human's decision so you can proceed or abort accordingly."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "Explain what you've done so far and what you're about to do",
                },
                "proposed_action": {
                    "type": "string",
                    "description": "The specific action requiring approval (shown to the human reviewer)",
                },
                "completed_actions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of actions already completed, for context",
                    "default": [],
                },
                "timeout_minutes": {
                    "type": "integer",
                    "description": "Minutes to wait before timing out. Defaults to 5.",
                    "default": 5,
                },
            },
            "required": ["message", "proposed_action"],
        },
    },
    {
        "name": "fetch_human_messages",
        "description": (
            "Fetch pending human messages from the Jarvis Comms Hub. "
            "Returns a list of messages the user has sent from the dashboard that are waiting for an agent reply. "
            "Use this to implement a poll-and-reply loop: check for messages, process them, then call send_human_reply."
        ),
        "inputSchema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "wait_for_human_message",
        "description": (
            "Block and wait for the next human message from the Jarvis Comms Hub. "
            "Call this after completing a task to wait for the next instruction from the dashboard. "
            "Returns as soon as a message arrives (or after timeout). "
            "Use this to create a continuous loop: finish task → wait_for_human_message → process → reply → repeat. "
            "This is the preferred way to keep Claude Code or Codex responsive to dashboard messages."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "timeout_minutes": {
                    "type": "integer",
                    "description": "Minutes to wait for a message before returning. Defaults to 5.",
                    "default": 5,
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_workshop_tasks",
        "description": (
            "Fetch tasks assigned to this agent from the Workshop. "
            "Returns backlog and in-progress tasks in priority order (in-progress first). "
            "Use this at the start of a session to discover what work is queued for you. "
            "After fetching, call update_workshop_task_status to move tasks through the pipeline."
        ),
        "inputSchema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "update_workshop_task_status",
        "description": (
            "Update the status of a Workshop task assigned to this agent. "
            "Call this to move a task from 'backlog' → 'in_progress' when starting, "
            "and from 'in_progress' → 'done' when complete. "
            "The task_id comes from get_workshop_tasks."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "UUID of the workshop task to update"},
                "status": {
                    "type": "string",
                    "enum": ["backlog", "in_progress", "done"],
                    "description": "New status for the task",
                },
            },
            "required": ["task_id", "status"],
        },
    },
    {
        "name": "send_human_reply",
        "description": (
            "Send a reply to a human message in the Jarvis Comms Hub. "
            "After calling fetch_human_messages and processing a message, use this to send a reply. "
            "Provide the command_id from the fetched message so the original message is marked as responded."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "The reply text to send back to the human"},
                "command_id": {
                    "type": "string",
                    "description": "The command ID from fetch_human_messages (used to ack and link the reply)",
                },
                "reply_to_message_id": {
                    "type": "string",
                    "description": "The comms message UUID to reply to (found in the command payload as messageId)",
                },
                "cost": {
                    "type": "number",
                    "description": "Optional USD cost incurred to generate this reply",
                    "default": 0,
                },
                "model": {"type": "string", "description": "Optional model name used to generate this reply"},
            },
            "required": ["content", "command_id"],
        },
    },
]


def _mcp_result(rpc_id: Any, text: str) -> JSONResponse:
    return JSONResponse({
        "jsonrpc": "2.0",
        "id": rpc_id,
        "result": {"content": [{"type": "text", "text": text}]},
    })


def _mcp_tool_error(rpc_id: Any, text: str) -> JSONResponse:
    return JSONResponse({
        "jsonrpc": "2.0",
        "id": rpc_id,
        "result": {"content": [{"type": "text", "text": text}], "isError": True},
    })


@app.post("/mcp")
async def mcp_http_endpoint(
    request: Request,
    token: str | None = Query(default=None),
) -> Response:
    """MCP Streamable HTTP transport — connect any MCP-compatible agent with one command.

    Usage:
        claude mcp add --transport http jarvis https://your-jarvis.com/mcp?token=YOUR_TOKEN
    """
    # Accept token from query param or Authorization: Bearer header
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        return JSONResponse(
            status_code=401,
            content={"error": "Missing token. Add ?token=YOUR_TOKEN to the MCP URL."},
        )

    pool = get_db_pool()
    with pool.connection() as conn:
        token_hash = hash_agent_token(token)
        row = conn.execute(
            "select agent_id from agent_tokens where token_hash = %s and revoked_at is null",
            (token_hash,),
        ).fetchone()
        if row is None:
            return JSONResponse(status_code=401, content={"error": "Invalid or revoked token."})
        agent_id: UUID = row["agent_id"]
        conn.execute(
            "update agents set last_seen_at = now() where id = %s::uuid",
            (agent_id,),
        )

    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON body."})

    method: str = body.get("method", "")
    params: dict = body.get("params") or {}
    rpc_id = body.get("id")

    if method == "initialize":
        return JSONResponse({
            "jsonrpc": "2.0",
            "id": rpc_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "jarvis-mc", "version": "1.0.0"},
            },
        })

    if method in ("notifications/initialized", "ping"):
        return JSONResponse({"jsonrpc": "2.0", "id": rpc_id, "result": {}})

    if method == "tools/list":
        return JSONResponse({
            "jsonrpc": "2.0",
            "id": rpc_id,
            "result": {"tools": _MCP_TOOL_DEFINITIONS},
        })

    if method == "tools/call":
        tool_name: str = params.get("name", "")
        arguments: dict = params.get("arguments") or {}
        return await _mcp_call_tool(rpc_id, agent_id, tool_name, arguments)

    return JSONResponse({
        "jsonrpc": "2.0",
        "id": rpc_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    })


async def _mcp_call_tool(
    rpc_id: Any,
    agent_id: UUID,
    tool_name: str,
    arguments: dict,
) -> JSONResponse:
    pool = get_db_pool()

    # ── log_action ───────────────────────────────────────────────────────────────
    if tool_name == "log_action":
        with pool.connection() as conn:
            agent_row = conn.execute(
                "select workspace_id from agents where id = %s::uuid", (agent_id,)
            ).fetchone()
            if agent_row is None:
                return _mcp_tool_error(rpc_id, "Error: Agent not found.")
            workspace_id = agent_row["workspace_id"]
            event_row = conn.execute(
                """
                insert into events (agent_id, workspace_id, type, message, cost,
                                    requires_approval, proposed_action, completed_actions)
                values (%s::uuid, %s::uuid, %s, %s, %s, false, null, %s)
                returning id
                """,
                (
                    agent_id,
                    workspace_id,
                    arguments.get("type", "action"),
                    arguments["message"],
                    arguments.get("cost", 0),
                    Jsonb([]),
                ),
            ).fetchone()
        _sse_publish(f"events:{workspace_id}", str(agent_id))
        _sse_publish(f"spend:{workspace_id}")
        return _mcp_result(rpc_id, f"Logged to Jarvis (event: {event_row['id']})")

    # ── request_approval ─────────────────────────────────────────────────────────
    if tool_name == "request_approval":
        timeout_minutes = int(arguments.get("timeout_minutes", 5))
        deadline = time.monotonic() + (timeout_minutes * 60)

        with pool.connection() as conn:
            agent_row = conn.execute(
                "select workspace_id from agents where id = %s::uuid", (agent_id,)
            ).fetchone()
            if agent_row is None:
                return _mcp_tool_error(rpc_id, "Error: Agent not found.")
            workspace_id = agent_row["workspace_id"]

            conn.execute(
                """
                insert into events (agent_id, workspace_id, type, message, cost,
                                    requires_approval, proposed_action, completed_actions)
                values (%s::uuid, %s::uuid, 'approval_request', %s, 0, true, %s, %s)
                """,
                (
                    agent_id,
                    workspace_id,
                    arguments["message"],
                    arguments["proposed_action"],
                    Jsonb(arguments.get("completed_actions", [])),
                ),
            )
            conn.execute(
                """
                insert into tasks (agent_id, workspace_id, proposed_action, completed_actions, status)
                values (%s::uuid, %s::uuid, %s, %s, 'pending')
                """,
                (
                    agent_id,
                    workspace_id,
                    arguments["proposed_action"],
                    Jsonb(arguments.get("completed_actions", [])),
                ),
            )
            conn.execute(
                "update agents set status = 'waiting_approval' where id = %s::uuid",
                (agent_id,),
            )

        _sse_publish(f"events:{workspace_id}", str(agent_id))
        _sse_publish(f"inbox:{workspace_id}")

        # Long-poll for the approval_decision command using internal SSE queues
        channel = f"commands:{agent_id}"
        while time.monotonic() < deadline:
            remaining = deadline - time.monotonic()
            poll_timeout = min(30.0, max(1.0, remaining))
            q: asyncio.Queue[str] = asyncio.Queue()
            _sse_queues[channel].append(q)
            try:
                await asyncio.wait_for(q.get(), timeout=poll_timeout)
            except asyncio.TimeoutError:
                pass
            finally:
                try:
                    _sse_queues[channel].remove(q)
                except ValueError:
                    pass

            with pool.connection() as conn:
                cmd_row = conn.execute(
                    """
                    select id, payload
                    from commands
                    where agent_id = %s::uuid
                      and kind = 'approval_decision'
                      and status = 'pending'
                    order by created_at asc
                    limit 1
                    """,
                    (agent_id,),
                ).fetchone()

            if cmd_row:
                with pool.connection() as conn:
                    conn.execute(
                        "update commands set status = 'acked', acked_at = now() where id = %s::uuid",
                        (cmd_row["id"],),
                    )
                payload_data = cmd_row["payload"] or {}
                decision = payload_data.get("decision", "unknown")
                comment = payload_data.get("comment", "")
                result_text = f"Decision: {decision}"
                if comment:
                    result_text += f". Comment: {comment}"
                return _mcp_result(rpc_id, result_text)

        return _mcp_result(
            rpc_id,
            f"Decision: timed out after {timeout_minutes} minute(s). No response from dashboard. Treat as rejected and abort.",
        )

    # ── fetch_human_messages ─────────────────────────────────────────────────────
    if tool_name == "fetch_human_messages":
        with pool.connection() as conn:
            rows = conn.execute(
                """
                with picked as (
                  update commands
                  set status = 'acked', acked_at = now()
                  where id in (
                    select id from commands
                    where agent_id = %s::uuid
                      and kind = 'human_message'
                      and status = 'pending'
                    order by created_at asc
                    for update skip locked
                  )
                  returning id, payload, source_message_id
                )
                select id, payload, source_message_id from picked
                order by (select created_at from commands c where c.id = picked.id)
                """,
                (agent_id,),
            ).fetchall()
            for row in rows:
                if row.get("source_message_id"):
                    conn.execute(
                        """
                        update comms_messages
                        set message_status = 'delivered', delivered_at = now()
                        where id = %s::uuid and message_status = 'queued'
                        """,
                        (row["source_message_id"],),
                    )

        if not rows:
            return _mcp_result(rpc_id, "No pending human messages.")

        lines = []
        for row in rows:
            payload_data = row["payload"] or {}
            lines.append(
                f"command_id: {row['id']}\n"
                f"message_id: {payload_data.get('messageId', '')}\n"
                f"content: {payload_data.get('content', '')}"
            )
        return _mcp_result(rpc_id, "\n\n---\n\n".join(lines))

    # ── wait_for_human_message ───────────────────────────────────────────────────
    if tool_name == "wait_for_human_message":
        timeout_minutes = int(arguments.get("timeout_minutes", 5))
        deadline = time.monotonic() + (timeout_minutes * 60)

        def _atomic_claim(conn: Any) -> list:
            """Atomically claim and ack all pending human_message commands for this agent."""
            claimed = conn.execute(
                """
                with picked as (
                  update commands
                  set status = 'acked', acked_at = now()
                  where id in (
                    select id from commands
                    where agent_id = %s::uuid
                      and kind = 'human_message'
                      and status = 'pending'
                    order by created_at asc
                    for update skip locked
                  )
                  returning id, payload, source_message_id
                )
                select id, payload, source_message_id from picked
                order by (select created_at from commands c where c.id = picked.id)
                """,
                (agent_id,),
            ).fetchall()
            for row in claimed:
                if row.get("source_message_id"):
                    conn.execute(
                        """
                        update comms_messages
                        set message_status = 'delivered', delivered_at = now()
                        where id = %s::uuid and message_status = 'queued'
                        """,
                        (row["source_message_id"],),
                    )
            return claimed

        def _format(rows: list) -> str:
            lines = []
            for row in rows:
                payload_data = row["payload"] or {}
                lines.append(
                    f"command_id: {row['id']}\n"
                    f"message_id: {payload_data.get('messageId', '')}\n"
                    f"content: {payload_data.get('content', '')}"
                )
            return "\n\n---\n\n".join(lines)

        # Check immediately for any already-pending messages first
        with pool.connection() as conn:
            rows = _atomic_claim(conn)

        if rows:
            return _mcp_result(rpc_id, _format(rows))

        # No messages yet — long-poll using SSE queue (no DB connection held during wait)
        channel = f"commands:{agent_id}"
        while time.monotonic() < deadline:
            remaining = deadline - time.monotonic()
            poll_timeout = min(30.0, max(1.0, remaining))
            q: asyncio.Queue[str] = asyncio.Queue()
            _sse_queues[channel].append(q)
            try:
                await asyncio.wait_for(q.get(), timeout=poll_timeout)
            except asyncio.TimeoutError:
                pass
            finally:
                try:
                    _sse_queues[channel].remove(q)
                except ValueError:
                    pass

            with pool.connection() as conn:
                rows = _atomic_claim(conn)

            if rows:
                return _mcp_result(rpc_id, _format(rows))

        return _mcp_result(rpc_id, f"No messages received after {timeout_minutes} minute(s). Call wait_for_human_message again to keep listening.")

    # ── get_workshop_tasks ───────────────────────────────────────────────────────
    if tool_name == "get_workshop_tasks":
        with pool.connection() as conn:
            rows = conn.execute(
                _WORKSHOP_SELECT + """
                where wt.agent_id = %s::uuid
                  and wt.status in ('backlog', 'in_progress')
                order by
                  case wt.status when 'in_progress' then 0 else 1 end,
                  wt.created_at asc
                """,
                (agent_id,),
            ).fetchall()

        if not rows:
            return _mcp_result(rpc_id, "No tasks assigned to this agent.")

        lines = []
        for row in rows:
            desc = f"\n  description: {row['description']}" if row.get("description") else ""
            lines.append(
                f"task_id: {row['id']}\n"
                f"  title: {row['title']}{desc}\n"
                f"  status: {row['status']}"
            )
        return _mcp_result(rpc_id, "\n\n".join(lines))

    # ── update_workshop_task_status ──────────────────────────────────────────────
    if tool_name == "update_workshop_task_status":
        task_id_str = arguments.get("task_id", "")
        new_status = arguments.get("status", "")
        with pool.connection() as conn:
            updated = conn.execute(
                """
                update workshop_tasks
                set status = %s, updated_at = now()
                where id = %s::uuid and agent_id = %s::uuid
                returning id, title, workspace_id
                """,
                (new_status, task_id_str, agent_id),
            ).fetchone()
        if updated is None:
            return _mcp_tool_error(rpc_id, "Task not found or not assigned to this agent.")
        _sse_publish(f"workshop:{updated['workspace_id']}")
        return _mcp_result(rpc_id, f"Task '{updated['title']}' moved to {new_status}.")

    # ── send_human_reply ─────────────────────────────────────────────────────────
    if tool_name == "send_human_reply":
        content = arguments.get("content", "")
        command_id_str = arguments.get("command_id", "")
        reply_to_message_id_str = arguments.get("reply_to_message_id")
        metadata: dict = {}
        if arguments.get("cost"):
            metadata["cost"] = arguments["cost"]
        if arguments.get("model"):
            metadata["model"] = arguments["model"]

        with pool.connection() as conn:
            agent_row = conn.execute(
                "select workspace_id from agents where id = %s::uuid", (agent_id,)
            ).fetchone()
            if agent_row is None:
                return _mcp_tool_error(rpc_id, "Error: Agent not found.")
            workspace_id = agent_row["workspace_id"]

            reply_to_id = UUID(reply_to_message_id_str) if reply_to_message_id_str else None

            with conn.transaction():
                msg_row = conn.execute(
                    """
                    insert into comms_messages
                      (workspace_id, agent_id, sender, content, message_status,
                       reply_to_message_id, metadata)
                    values (%s::uuid, %s::uuid, 'agent', %s, 'responded', %s, %s)
                    returning id
                    """,
                    (workspace_id, agent_id, content, reply_to_id, Jsonb(metadata)),
                ).fetchone()

                if reply_to_id:
                    conn.execute(
                        """
                        update comms_messages
                        set message_status = 'responded', responded_at = now()
                        where id = %s::uuid
                        """,
                        (reply_to_id,),
                    )

                conn.execute(
                    """
                    update commands
                    set status = 'acked', acked_at = now()
                    where id = %s::uuid and agent_id = %s::uuid
                    """,
                    (UUID(command_id_str), agent_id),
                )

        _sse_publish(f"comms:{workspace_id}", '{"type":"update"}')
        return _mcp_result(rpc_id, f"Reply sent (message: {msg_row['id']})")

    return JSONResponse({
        "jsonrpc": "2.0",
        "id": rpc_id,
        "error": {"code": -32602, "message": f"Unknown tool: {tool_name}"},
    })
