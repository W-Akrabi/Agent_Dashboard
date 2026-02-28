from __future__ import annotations

from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

import psycopg
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    BudgetUpdateRequest,
    CommandResponse,
    EventIngestRequest,
    EventIngestResponse,
    InboxDecisionRequest,
    InboxItemResponse,
    InboxStatus,
    SpendResponse,
    UserTokenIssueRequest,
    UserTokenResponse,
)
from .security import (
    generate_agent_token,
    hash_agent_token,
    mask_token_hash,
    verify_control_plane_token,
)

settings = get_settings()


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


def _agent_from_row(row: dict[str, Any]) -> AgentResponse:
    return AgentResponse(
        id=row["id"],
        name=row["name"],
        status=row["status"],
        totalSpend=_to_float(row["total_spend"]),
        lastSeen=row["last_seen"],
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


def _require_user_auth(
    authorization: str | None = Header(default=None, alias="Authorization"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> AuthenticatedUser:
    token_hash = hash_agent_token(_extract_bearer_token(authorization))
    row = connection.execute(
        """
        select id, email, workspace_id
        from users
        where api_token_hash = %s and api_token_revoked_at is null
        """,
        (token_hash,),
    ).fetchone()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user token.",
        )
    if row["workspace_id"] is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not assigned to a workspace.",
        )
    connection.execute(
        """
        update users
        set api_token_last_used_at = now()
        where id = %s::uuid
        """,
        (row["id"],),
    )

    return AuthenticatedUser(
        id=row["id"],
        email=row["email"],
        workspace_id=row["workspace_id"],
    )


def _require_control_plane_auth(
    x_control_plane_token: str | None = Header(default=None, alias="X-Control-Plane-Token"),
) -> None:
    if verify_control_plane_token(x_control_plane_token, settings.control_plane_token):
        return
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing X-Control-Plane-Token.",
    )


def _get_user_for_token_admin(
    connection: Connection[dict[str, Any]],
    email: str | None,
) -> dict[str, Any]:
    if email:
        row = connection.execute(
            """
            select id, email, api_token_hash, api_token_revoked_at
            from users
            where lower(email) = lower(%s)
            """,
            (email.strip(),),
        ).fetchone()
    else:
        row = connection.execute(
            """
            select id, email, api_token_hash, api_token_revoked_at
            from users
            order by created_at asc
            limit 1
            """
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return row


def _issue_user_token(
    connection: Connection[dict[str, Any]],
    user_id: UUID,
    email: str,
    had_active_token: bool,
) -> UserTokenResponse:
    token = generate_agent_token()
    token_hash = hash_agent_token(token)
    row = connection.execute(
        """
        update users
        set
          api_token_hash = %s,
          api_token_issued_at = now(),
          api_token_last_rotated_at = case when %s then now() else null end,
          api_token_revoked_at = null,
          api_token_last_used_at = null
        where id = %s::uuid
        returning api_token_issued_at, api_token_last_rotated_at
        """,
        (token_hash, had_active_token, user_id),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=500, detail="Failed to issue user token.")

    return UserTokenResponse(
        userId=user_id,
        email=email,
        userToken=token,
        issuedAt=row["api_token_issued_at"],
        rotatedAt=row["api_token_last_rotated_at"],
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
          coalesce(max(e.created_at), a.created_at) as last_seen,
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


def _bootstrap_default_identity(connection: Connection[dict[str, Any]]) -> None:
    connection.execute(
        """
        insert into users (email, monthly_budget, workspace_id)
        values ('owner@jarvis.local', 1000, gen_random_uuid())
        on conflict (email) do nothing
        """
    )

    connection.execute(
        """
        update users
        set workspace_id = coalesce(workspace_id, gen_random_uuid())
        where workspace_id is null
        """
    )

    has_user_token_or_history = connection.execute(
        """
        select 1
        from users
        where api_token_hash is not null
          or api_token_issued_at is not null
        limit 1
        """
    ).fetchone()
    if has_user_token_or_history is None:
        connection.execute(
            """
            update users
            set
              api_token_hash = %s,
              api_token_issued_at = now(),
              api_token_last_rotated_at = null,
              api_token_revoked_at = null,
              api_token_last_used_at = null
            where id = (
              select id
              from users
              order by created_at asc
              limit 1
            )
            """,
            (hash_agent_token(settings.control_plane_token),),
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db_pool(settings)
    pool = get_db_pool()
    with pool.connection() as connection:
        _bootstrap_default_identity(connection)
    try:
        yield
    finally:
        close_db_pool()


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


@app.post(
    "/v1/user-token/issue",
    response_model=UserTokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def issue_user_token(
    payload: UserTokenIssueRequest | None = None,
    _: None = Depends(_require_control_plane_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> UserTokenResponse:
    email = payload.email if payload else None
    user_row = _get_user_for_token_admin(connection, email)
    had_active_token = (
        user_row["api_token_hash"] is not None
        and user_row["api_token_revoked_at"] is None
    )
    return _issue_user_token(
        connection=connection,
        user_id=user_row["id"],
        email=user_row["email"],
        had_active_token=had_active_token,
    )


@app.post("/v1/user-token/rotate", response_model=UserTokenResponse)
def rotate_user_token(
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> UserTokenResponse:
    return _issue_user_token(
        connection=connection,
        user_id=auth_user.id,
        email=auth_user.email,
        had_active_token=True,
    )


@app.post(
    "/v1/user-token/revoke",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def revoke_user_token(
    auth_user: AuthenticatedUser = Depends(_require_user_auth),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> Response:
    revoked = connection.execute(
        """
        update users
        set
          api_token_hash = null,
          api_token_revoked_at = now()
        where id = %s::uuid and api_token_revoked_at is null
        returning id
        """,
        (auth_user.id,),
    ).fetchone()
    if revoked is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User token is already revoked.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
          coalesce(max(e.created_at), a.created_at) as last_seen,
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

    connection.execute(
        """
        insert into agent_tokens (agent_id, token_hash)
        values (%s::uuid, %s)
        """,
        (created_agent["id"], token_hash),
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
    proposed_action = payload.proposedAction if payload.requiresApproval else None

    event_row = connection.execute(
        """
        insert into events (
          agent_id,
          type,
          message,
          cost,
          requires_approval,
          proposed_action,
          completed_actions
        )
        values (%s::uuid, %s, %s, %s, %s, %s, %s)
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
            insert into tasks (agent_id, proposed_action, completed_actions, status)
            values (%s::uuid, %s, %s, 'pending')
            returning id
            """,
            (agent_id, payload.proposedAction, Jsonb(payload.completedActions)),
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

    return EventIngestResponse(event=_event_from_row(event_row), taskId=task_id)


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

        command_row = connection.execute(
            """
            insert into commands (agent_id, source_task_id, kind, payload, status)
            values (%s::uuid, %s::uuid, 'approval_decision', %s, 'pending')
            on conflict do nothing
            returning id
            """,
            (
                task_row["agent_id"],
                item_id,
                Jsonb({"decision": payload.decision, "comment": payload.comment}),
            ),
        ).fetchone()
        if command_row is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A decision command already exists for this inbox item.",
            )

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
              source_task_id
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
              source_task_id
            from commands
            where agent_id = %s::uuid
              and status = 'pending'
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
          source_task_id
        """,
        (command_id, agent_id),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Command not found.")
    return _command_from_row(row)
