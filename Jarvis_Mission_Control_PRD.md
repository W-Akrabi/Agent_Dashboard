# Jarvis Mission Control
## Product Requirements Document (PRD)
### Version: MVP v1

---

## 1. Product Summary

**Jarvis Mission Control** is a web-based hub that lets users monitor, manage, and approve actions from their AI agents in real time.

It acts as a **control plane** for agents running locally (e.g., Mac minis) or in the cloud, providing:

- ✅ Live visibility into agent activity  
- ✅ Human-in-the-loop approvals  
- ✅ Spend tracking  
- ✅ Guardrails and controls  
- ✅ Unified management across multiple agents  

Jarvis is not an agent framework. It is an **agent oversight and coordination layer**.

---

## 2. Problem Statement

Users running AI agents today face:

- ✅ No unified view across multiple agents — *Dashboard with all agent cards*
- ✅ Activity buried in terminals/logs — *Live Activity Feed + Event History per agent*
- ✅ Hard-to-track API spend across providers — *API Spend view with per-agent breakdown*
- ✅ No structured approval workflow — *Inbox approval queue*
- ✅ Risk of runaway loops or uncontrolled costs — *Budget cap + pause/resume controls*

---

## 3. Target Users (MVP)

**Primary:**
- ✅ Technical individuals running 1–10 agents  
- ✅ Developers using Claude/OpenAI/Gemini via scripts  
- ✅ Mac mini / local server agent operators  

**Secondary (later):**
- ⚠️ Small teams managing agent workflows — *Not MVP scope*

---

## 4. Core Value Proposition

> "See everything your agents are doing. Approve what matters. Stay in control."

✅ Implemented across Dashboard, Inbox, Agent Detail, and Spend views.

---

## 5. Core User Stories (MVP)

### Visibility
- ✅ As a user, I can see all my agents and their current status.  
  *→ Agent cards on Dashboard with status badges (running/idle/paused/error/waiting_approval)*
- ✅ As a user, I can see a live feed of what agents are doing.  
  *→ Live Activity Feed on Dashboard*
- ✅ As a user, I can click into an agent to view its full history.  
  *→ Agent Detail panel with full event history, opened by clicking any agent card*

### Human-in-the-loop
- ✅ As a user, I can see when an agent proposes a next action.  
  *→ Inbox shows "Proposed Next Action" per item*
- ✅ As a user, I can approve or reject that action.  
  *→ Approve / Reject buttons with optional comment field in Inbox*
- ✅ As a user, my decision is sent back to the agent.  
  *→ Decision updates inbox item and creates command in `/v1/commands`*

### Cost Awareness
- ✅ As a user, I can see how much I've spent today.  
  *→ "Today's Spend" stat card on Dashboard + API Spend view*
- ✅ As a user, I can see monthly spend vs budget.  
  *→ Budget progress bar with live % indicator in API Spend*
- ✅ As a user, I can see spend per agent.  
  *→ "Spend by Agent" breakdown in API Spend view*

### Control
- ✅ As a user, I can pause or resume an agent.  
  *→ Pause/Resume button on each agent card AND in Agent Detail panel*
- ✅ As a user, I can revoke an agent's token.  
  *→ "Revoke Token" button in Agent Detail with confirmation dialog*
- ✅ As a user, I can set a monthly budget.  
  *→ "Edit Cap" button in API Spend with inline input field*

---

## 6. MVP Feature Set

### 6.1 Authentication
- ❌ Email/password or OAuth — *Not implemented (MVP frontend focus)*  
- ⚠️ Each user has isolated workspace — *Backend has `users` table, but multi-tenant auth isolation is not implemented*

### 6.2 Agent Registration
- ✅ User can create a new agent — *"Register Agent" button + modal on Dashboard*
- ✅ Generate `agent_id` — *UUID-style ID generated on registration*
- ✅ Generate `agent_token` — *32-char token generated and shown once with copy button*

Agent uses:
- ✅ `POST /v1/events` — *Implemented in FastAPI with token auth + Supabase persistence*
- ✅ `GET /v1/commands` — *Implemented in FastAPI with token auth*

### 6.3 Event Ingest API (Core Engine)
- ✅ `POST /v1/events` endpoint — *Implemented in `backend/app/main.py`*  
- ✅ Stores event — *Persisted in Supabase `events` table*
- ❌ Broadcasts via realtime — *WebSocket/realtime push not implemented*
- ✅ If requires_approval → creates inbox item — *Creates `tasks` row and updates agent status*

### 6.4 Command Retrieval API
- ✅ `GET /v1/commands?since=timestamp` — *Implemented; returns pending commands for authenticated agent token*
- ✅ `POST /v1/commands/{id}/ack` — *Implemented; marks command as acked*

### 6.5 Dashboard (Home Screen)
- ✅ Active agent count — *"Active Agents" stat card*
- ✅ Pending approvals — *"Pending Approvals" stat card (synced to agent statuses)*
- ✅ Spend today — *"Today's Spend" stat card*
- ✅ Budget status — *API Spend view with progress bar*
- ✅ Live activity feed — *Feed list with agent + message + timestamp*

### 6.6 Agent Detail Page
- ✅ Status (running, idle, waiting approval, error) — *Full status badge with color*
- ✅ Total spend — *Shown in stats row*
- ✅ Event history — *Per-agent event list with type, cost, timestamp*
- ✅ Last seen timestamp — *Shown in stats row*
- ✅ Pause/Resume button — *Context-aware button based on current status*
- ✅ Token revoke button — *With confirmation dialog to prevent accidents*

### 6.7 Inbox (Approval Queue)
- ✅ Agent name — *Shown as colored badge on each inbox card*
- ✅ What it completed — *"✔ Completed" section per card*
- ✅ Proposed next action — *"→ Proposed Next Action" section, highlighted*
- ✅ Approve / Reject buttons — *Large prominent buttons*
- ✅ Optional comment field — *Input shown below proposed action*
- ✅ Approval triggers command sent to agent — *Status updates; badge count decrements*
- ✅ Sidebar badge showing pending count — *Orange badge on Inbox nav item*

### 6.8 Spend Tracking
- ✅ Daily spend — *Shown in Dashboard + API Spend*
- ✅ Monthly spend — *Progress bar against budget cap in API Spend*
- ✅ Spend per agent — *Agent-level breakdown in API Spend*
- ✅ Budget progress bar — *Animated progress bar with warning colors at 80%+*
- ✅ User sets monthly cap — *"Edit Cap" inline input in API Spend*
- ✅ If exceeded → alert banner — *Alert banner at top of Dashboard*

---

## 7. Non-Functional Requirements

### Security
- ✅ Agent tokens hashed in DB — *SHA-256 token hashes stored in `agent_tokens`*
- ✅ Tokens only shown once on registration — *Copy-once modal in Agent Registration*
- ❌ Rate limit per token — *No backend*
- ⚠️ TLS only — *Supabase Postgres uses TLS; local FastAPI dev server can run without TLS*
- ❌ Event idempotency — *No backend*

### Reliability
- ❌ Agents retry failed POSTs — *No backend*
- ❌ Server supports idempotent writes — *No backend*
- ⚠️ No event loss on retry — *Events are persisted in Postgres; dedupe/idempotency key still not implemented*

### Performance
- ✅ Dashboard loads < 2 seconds — *Vite + React SPA, near-instant*
- ⚠️ Feed updates < 1 second — *Loads from backend API; no realtime push channel yet*

---

## 8. Architecture Overview

### Agent Side
- ✅ Sends events via HTTPS — *Live `POST /v1/events` endpoint implemented*
- ✅ Polls for commands — *Live `GET /v1/commands` + `POST /v1/commands/{id}/ack` implemented*

### Jarvis Backend
- ✅ REST API — *Implemented with FastAPI in `backend/app/main.py`*
- ✅ Postgres DB — *Supabase schema in `backend/sql/schema.sql`*
- ❌ Realtime subscription layer — *Not implemented*
- ❌ Background worker — *Not implemented*

### Frontend
- ⚠️ Realtime feed subscription — *Feed now loads from backend API but not via websocket subscription*
- ✅ Approval actions — *Approve/reject/comment wired to backend inbox + command APIs*
- ✅ Spend visualizations — *Budget bar, per-agent breakdown, stat cards now backed by API data*

---

## 9. Data Model (MVP)

### users ✅ *Persisted in Supabase Postgres*
- ✅ `id`, `email`, `monthly_budget` — *Backed by DB table + budget update API*

### agents ✅ *Persisted in Supabase Postgres*
- ✅ `id`, `name`, `status`, `totalSpend`, `lastSeen`, `tokenHash`, `eventsCount`

### events ✅ *Persisted in Supabase Postgres*
- ✅ `id`, `agentId`, `type`, `message`, `cost`, `createdAt`

### tasks ✅ *Persisted in Supabase Postgres*
- ✅ `id`, `agentId`, `proposedAction`, `status`, `comment`, `createdAt`

### commands ✅ *Persisted in Supabase Postgres*
- ✅ `id`, `agent_id`, `source_task_id`, `kind`, `payload`, `status`, `created_at`, `acked_at`

---

## 10. MVP Success Criteria

- ✅ Users can connect an agent in < 5 minutes — *Register modal generates creds instantly*
- ⚠️ At least 70% of users check dashboard weekly — *Metric; requires analytics*
- ✅ Approval loop works reliably — *Inbox approve/reject fully functional*
- ✅ No critical data loss incidents — *Core operational data persisted in Supabase Postgres*
- ⚠️ Spend tracking matches provider dashboards within 5% — *Current spend derived from ingested event costs, not direct provider reconciliation*

---

## 11. Future Expansion (Not MVP)

- ✅ Scheduler — *Implemented (Cron Jobs view)*
- ✅ Multi-agent graph — *Implemented (Agent Architecture Graph view)*
- ✅ Memory store — *Implemented (Memory view)*
- ✅ API key vault — *Implemented (Key Vault view)*
- ✅ Rules engine (Sleep Mode) — *Implemented (Sleep Mode automation rules)*
- ❌ WebSocket real-time commands — *Not yet*
- ❌ MCP compatibility layer — *Not yet*
- ❌ Team accounts — *Not yet*
- ❌ Proxy model requests — *Not yet*

---

## 12. Strategic Positioning

Jarvis is:

- ✅ Not an agent framework  
- ✅ Not a model provider  
- ✅ Not a prompt tool  

Jarvis is:

> **The oversight layer for autonomous systems.**

---

## 13. Implementation Update (February 27, 2026)

- ✅ Repository structure separated into `frontend/` (React app) and `backend/` (FastAPI service).
- ✅ Python backend added under `backend/app` using FastAPI.
- ✅ Supabase Postgres schema added under `backend/sql/schema.sql`.
- ✅ Frontend core pages (`Dashboard`, `Agents`, `AgentDetail`, `Inbox`, `Spend`, sidebar badge) moved from local mocks to API calls.
- ✅ Implemented API routes for agent lifecycle, event ingest, inbox decisions, spend aggregation, and command polling/ack.
- ⚠️ Realtime push (WebSocket/Supabase Realtime), rate limiting, and idempotency keys remain future work.

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented in current build |
| ⚠️ | Partially implemented or simulated (mock data / no backend) |
| ❌ | Not implemented (requires backend or out of MVP scope) |
