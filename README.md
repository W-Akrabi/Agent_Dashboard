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
- Set `CONTROL_PLANE_TOKEN` to a strong random value.
  It must be unique per environment and never committed as a real secret.
  It is server-side only and used to bootstrap the first user bearer token when no user token exists.
- Optional DB pool tuning: `DB_POOL_MIN_SIZE`, `DB_POOL_MAX_SIZE`, `DB_POOL_TIMEOUT_SECONDS`, `DB_POOL_MAX_IDLE_SECONDS`.

4. Run backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend docs: `http://localhost:8000/docs`

Dashboard auth:
- Dashboard/control-plane routes require `Authorization: Bearer <user_token>`.
- Frontend/browser clients must never send `X-Control-Plane-Token`.
- If you need a machine-to-machine control token, keep it server-side and forward user-authenticated requests through a trusted backend-for-frontend layer.

## 2) Frontend Setup

1. Configure API base URL:

```bash
cd frontend
cp .env.example .env.local
```

`frontend/.env.local` should only include browser-safe values (for example `VITE_API_BASE_URL`).
Do not add `CONTROL_PLANE_TOKEN` or `VITE_CONTROL_PLANE_TOKEN` to frontend env files.

2. Bootstrap a real user token from a trusted server environment:

```bash
curl -sS -X POST http://localhost:8000/v1/user-token/issue \
  -H "X-Control-Plane-Token: $CONTROL_PLANE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

3. Store the returned `userToken` in browser local storage:

```js
localStorage.setItem('jarvis_user_token', 'YOUR_USER_BEARER_TOKEN')
```

4. Rotate/revoke user tokens as needed:
- Rotate: `POST /v1/user-token/rotate` with `Authorization: Bearer <current_user_token>`
- Revoke: `POST /v1/user-token/revoke` with `Authorization: Bearer <current_user_token>`

5. Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## API Surface (MVP)

- `POST /v1/user-token/issue` (`X-Control-Plane-Token` required)
- `POST /v1/user-token/rotate` (`Authorization: Bearer <user_token>` required)
- `POST /v1/user-token/revoke` (`Authorization: Bearer <user_token>` required)
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
