from __future__ import annotations

from decimal import Decimal
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from psycopg import Connection
from psycopg.types.json import Jsonb

from .config import get_settings
from .db import get_db
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
    SpendResponse,
)
from .security import generate_agent_token, hash_agent_token, mask_token_hash

settings = get_settings()
app = FastAPI(title="Jarvis Mission Control API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
) -> str:
    if not x_agent_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Agent-Token header.",
        )

    token_hash = hash_agent_token(x_agent_token)
    row = connection.execute(
        """
        select agent_id::text as agent_id
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


def _fetch_agent(connection: Connection[dict[str, Any]], agent_id: str) -> AgentResponse:
    row = connection.execute(
        """
        select
          a.id::text as id,
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
        where a.id = %s::uuid
        group by a.id, a.name, a.status, a.description, a.created_at, t.token_hash
        """,
        (agent_id,),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    return _agent_from_row(row)


def _ensure_default_user(connection: Connection[dict[str, Any]]) -> dict[str, Any]:
    existing_user = connection.execute(
        """
        select id::text as id, email, monthly_budget
        from users
        order by created_at asc
        limit 1
        """
    ).fetchone()
    if existing_user is not None:
        return existing_user

    created_user = connection.execute(
        """
        insert into users (email, monthly_budget)
        values ('owner@jarvis.local', 1000)
        returning id::text as id, email, monthly_budget
        """
    ).fetchone()
    if created_user is None:
        raise HTTPException(status_code=500, detail="Failed to initialize default user.")
    return created_user


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/agents", response_model=list[AgentResponse])
def list_agents(connection: Connection[dict[str, Any]] = Depends(get_db)) -> list[AgentResponse]:
    rows = connection.execute(
        """
        select
          a.id::text as id,
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
        group by a.id, a.name, a.status, a.description, a.created_at, t.token_hash
        order by a.created_at desc
        """
    ).fetchall()
    return [_agent_from_row(row) for row in rows]


@app.post("/v1/agents", response_model=AgentCreateResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    payload: AgentCreateRequest,
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> AgentCreateResponse:
    token = generate_agent_token()
    token_hash = hash_agent_token(token)

    created_agent = connection.execute(
        """
        insert into agents (name, description, status)
        values (%s, %s, 'idle')
        returning id::text as id
        """,
        (payload.name.strip(), payload.description),
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
        agent=_fetch_agent(connection, created_agent["id"]),
        agentToken=token,
    )


@app.get("/v1/agents/{agent_id}", response_model=AgentResponse)
def get_agent(
    agent_id: str,
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> AgentResponse:
    return _fetch_agent(connection, agent_id)


@app.patch("/v1/agents/{agent_id}/status", response_model=AgentResponse)
def update_agent_status(
    agent_id: str,
    payload: AgentStatusUpdateRequest,
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> AgentResponse:
    updated = connection.execute(
        """
        update agents
        set status = %s
        where id = %s::uuid
        returning id::text as id
        """,
        (payload.status, agent_id),
    ).fetchone()
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")
    return _fetch_agent(connection, agent_id)


@app.post(
    "/v1/agents/{agent_id}/revoke-token",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def revoke_agent_token(
    agent_id: str,
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> Response:
    exists = connection.execute(
        "select 1 from agents where id = %s::uuid",
        (agent_id,),
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
    agent_id: str,
    limit: int = Query(default=100, ge=1, le=500),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[AgentEventResponse]:
    rows = connection.execute(
        """
        select
          id::text as id,
          agent_id::text as agent_id,
          type,
          message,
          cost,
          created_at
        from events
        where agent_id = %s::uuid
        order by created_at desc
        limit %s
        """,
        (agent_id, limit),
    ).fetchall()
    return [_event_from_row(row) for row in rows]


@app.get("/v1/events", response_model=list[AgentEventResponse])
def list_events(
    limit: int = Query(default=50, ge=1, le=500),
    agentId: str | None = Query(default=None),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[AgentEventResponse]:
    if agentId:
        rows = connection.execute(
            """
            select
              id::text as id,
              agent_id::text as agent_id,
              type,
              message,
              cost,
              created_at
            from events
            where agent_id = %s::uuid
            order by created_at desc
            limit %s
            """,
            (agentId, limit),
        ).fetchall()
    else:
        rows = connection.execute(
            """
            select
              id::text as id,
              agent_id::text as agent_id,
              type,
              message,
              cost,
              created_at
            from events
            order by created_at desc
            limit %s
            """,
            (limit,),
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
          id::text as id,
          agent_id::text as agent_id,
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

    task_id: str | None = None
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
            returning id::text as id
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
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[InboxItemResponse]:
    if status_filter:
        rows = connection.execute(
            """
            select
              t.id::text as id,
              t.agent_id::text as agent_id,
              a.name as agent_name,
              t.proposed_action,
              t.completed_actions,
              t.status,
              t.comment,
              t.created_at
            from tasks t
            join agents a on a.id = t.agent_id
            where t.status = %s
            order by t.created_at desc
            limit %s
            """,
            (status_filter, limit),
        ).fetchall()
    else:
        rows = connection.execute(
            """
            select
              t.id::text as id,
              t.agent_id::text as agent_id,
              a.name as agent_name,
              t.proposed_action,
              t.completed_actions,
              t.status,
              t.comment,
              t.created_at
            from tasks t
            join agents a on a.id = t.agent_id
            order by
              case when t.status = 'pending' then 0 else 1 end,
              t.created_at desc
            limit %s
            """,
            (limit,),
        ).fetchall()

    return [_inbox_from_row(row) for row in rows]


@app.post("/v1/inbox/{item_id}/decision", response_model=InboxItemResponse)
def decide_inbox_item(
    item_id: str,
    payload: InboxDecisionRequest,
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> InboxItemResponse:
    task_row = connection.execute(
        """
        select id::text as id, agent_id::text as agent_id, status
        from tasks
        where id = %s::uuid
        """,
        (item_id,),
    ).fetchone()
    if task_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inbox item not found.")
    if task_row["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inbox item already decided.",
        )

    connection.execute(
        """
        update tasks
        set status = %s, comment = %s, decided_at = now()
        where id = %s::uuid
        """,
        (payload.decision, payload.comment, item_id),
    )

    connection.execute(
        """
        insert into commands (agent_id, source_task_id, kind, payload, status)
        values (%s::uuid, %s::uuid, 'approval_decision', %s, 'pending')
        """,
        (
            task_row["agent_id"],
            item_id,
            Jsonb({"decision": payload.decision, "comment": payload.comment}),
        ),
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
          t.id::text as id,
          t.agent_id::text as agent_id,
          a.name as agent_name,
          t.proposed_action,
          t.completed_actions,
          t.status,
          t.comment,
          t.created_at
        from tasks t
        join agents a on a.id = t.agent_id
        where t.id = %s::uuid
        """,
        (item_id,),
    ).fetchone()
    if updated_row is None:
        raise HTTPException(status_code=500, detail="Failed to load updated inbox item.")
    return _inbox_from_row(updated_row)


@app.get("/v1/spend", response_model=SpendResponse)
def get_spend(connection: Connection[dict[str, Any]] = Depends(get_db)) -> SpendResponse:
    user = _ensure_default_user(connection)

    daily_row = connection.execute(
        """
        select coalesce(sum(cost), 0)::float8 as daily
        from events
        where created_at >= date_trunc('day', now())
        """
    ).fetchone()
    monthly_row = connection.execute(
        """
        select coalesce(sum(cost), 0)::float8 as monthly
        from events
        where created_at >= date_trunc('month', now())
        """
    ).fetchone()
    breakdown_rows = connection.execute(
        """
        select
          a.id::text as agent_id,
          a.name as agent_name,
          coalesce(sum(e.cost), 0)::float8 as spend
        from agents a
        left join events e on e.agent_id = a.id
          and e.created_at >= date_trunc('month', now())
        group by a.id, a.name
        order by spend desc, a.name asc
        """
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
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> SpendResponse:
    user = _ensure_default_user(connection)
    connection.execute(
        """
        update users
        set monthly_budget = %s
        where id = %s::uuid
        """,
        (payload.budget, user["id"]),
    )
    return get_spend(connection)


@app.get("/v1/commands", response_model=list[CommandResponse])
def get_commands(
    since: str | None = Query(default=None),
    x_agent_token: str | None = Header(default=None, alias="X-Agent-Token"),
    connection: Connection[dict[str, Any]] = Depends(get_db),
) -> list[CommandResponse]:
    agent_id = _require_agent_id(connection, x_agent_token)

    if since:
        rows = connection.execute(
            """
            select
              id::text as id,
              agent_id::text as agent_id,
              kind,
              payload,
              status,
              created_at,
              source_task_id::text as source_task_id
            from commands
            where agent_id = %s::uuid
              and status = 'pending'
              and created_at >= %s::timestamptz
            order by created_at asc
            """,
            (agent_id, since),
        ).fetchall()
    else:
        rows = connection.execute(
            """
            select
              id::text as id,
              agent_id::text as agent_id,
              kind,
              payload,
              status,
              created_at,
              source_task_id::text as source_task_id
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
    command_id: str,
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
          id::text as id,
          agent_id::text as agent_id,
          kind,
          payload,
          status,
          created_at,
          source_task_id::text as source_task_id
        """,
        (command_id, agent_id),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Command not found.")
    return _command_from_row(row)
