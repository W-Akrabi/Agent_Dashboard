# Jarvis Mission Control

Jarvis Mission Control is an oversight dashboard for AI agents with:
- Agent registry and status controls
- Human approval inbox
- Event ingest API and command queue
- Spend tracking with budget controls

The frontend is React + Vite, and the backend is FastAPI connected to Supabase Postgres.

## Project Structure

- `frontend/` React + Vite app
- `backend/app/` FastAPI backend
- `backend/sql/schema.sql` Supabase schema
- `Jarvis_Mission_Control_PRD.md` product requirements and implementation status

## 1) Backend Setup

1. Apply `backend/sql/schema.sql` in Supabase SQL Editor.
2. Configure env:

```bash
cd backend
cp .env.example .env
```

3. Set DB configuration in `.env`:
- Option A: `DATABASE_URL` (password must be URL-encoded)
- Option B: `SUPABASE_DB_*` fields (recommended for special characters in password)

4. Run backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend docs: `http://localhost:8000/docs`

## 2) Frontend Setup

1. Configure API base URL:

```bash
cd frontend
cp .env.example .env.local
```

2. Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## API Surface (MVP)

- `GET /v1/agents`
- `POST /v1/agents`
- `GET /v1/agents/{id}`
- `PATCH /v1/agents/{id}/status`
- `POST /v1/agents/{id}/revoke-token`
- `GET /v1/agents/{id}/events`
- `GET /v1/events`
- `POST /v1/events` (`X-Agent-Token` required)
- `GET /v1/inbox`
- `POST /v1/inbox/{id}/decision`
- `GET /v1/spend`
- `PATCH /v1/spend/budget`
- `GET /v1/commands` (`X-Agent-Token` required)
- `POST /v1/commands/{id}/ack` (`X-Agent-Token` required)
