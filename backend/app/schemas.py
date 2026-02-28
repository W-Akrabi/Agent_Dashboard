from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Any, Literal

from pydantic import BaseModel, Field


AgentStatus = Literal["running", "idle", "paused", "error", "waiting_approval"]
EventType = Literal["action", "completion", "error", "tool_call", "approval_request"]
InboxStatus = Literal["pending", "approved", "rejected"]
CommandStatus = Literal["pending", "acked"]


class AgentResponse(BaseModel):
    id: UUID
    name: str
    status: AgentStatus
    totalSpend: float
    lastSeen: datetime
    tokenHash: str
    eventsCount: int
    description: str | None = None
    createdAt: datetime


class AgentCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class AgentCreateResponse(BaseModel):
    agent: AgentResponse
    agentToken: str


class AgentStatusUpdateRequest(BaseModel):
    status: Literal["running", "paused", "idle", "error", "waiting_approval"]


class AgentEventResponse(BaseModel):
    id: UUID
    agentId: UUID
    type: EventType
    message: str
    cost: float
    createdAt: datetime


class EventIngestRequest(BaseModel):
    type: EventType
    message: str = Field(min_length=1, max_length=2000)
    cost: float = Field(default=0, ge=0)
    requiresApproval: bool = False
    proposedAction: str | None = Field(default=None, max_length=2000)
    completedActions: list[str] = Field(default_factory=list)


class EventIngestResponse(BaseModel):
    event: AgentEventResponse
    taskId: UUID | None = None


class InboxItemResponse(BaseModel):
    id: UUID
    agentId: UUID
    agentName: str
    proposedAction: str
    completedActions: list[str]
    status: InboxStatus
    comment: str | None = None
    createdAt: datetime


class InboxDecisionRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    comment: str | None = Field(default=None, max_length=2000)


class CommandResponse(BaseModel):
    id: UUID
    agentId: UUID
    kind: str
    payload: dict[str, Any]
    status: CommandStatus
    createdAt: datetime
    sourceTaskId: UUID | None = None


class SpendBreakdownItem(BaseModel):
    agentId: UUID
    agentName: str
    spend: float


class SpendResponse(BaseModel):
    daily: float
    monthly: float
    budget: float
    agentBreakdown: list[SpendBreakdownItem]


class BudgetUpdateRequest(BaseModel):
    budget: float = Field(gt=0)


class UserTokenIssueRequest(BaseModel):
    email: str | None = Field(default=None, max_length=320)


class UserTokenResponse(BaseModel):
    userId: UUID
    email: str
    userToken: str
    issuedAt: datetime
    rotatedAt: datetime | None = None


class UserSignupRequest(BaseModel):
    email: str = Field(max_length=320)
    password: str = Field(min_length=8)


class UserLoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    userId: UUID
    email: str
    userToken: str
    issuedAt: datetime
