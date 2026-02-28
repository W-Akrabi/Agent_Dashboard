# Jarvis Backend (FastAPI + Supabase)

## 1) Configure environment

```bash
cd backend
cp .env.example .env
```

Set either `DATABASE_URL` or the `SUPABASE_DB_*` fields in `.env`.
Set `CONTROL_PLANE_TOKEN` to a strong random server-side secret.
This value must be unique per environment and never committed as a real secret.
It is used to bootstrap the first user bearer token only when no user token exists.
Do not expose it to browser clients.

Optional DB pool tuning:
- `DB_POOL_MIN_SIZE`
- `DB_POOL_MAX_SIZE`
- `DB_POOL_TIMEOUT_SECONDS`
- `DB_POOL_MAX_IDLE_SECONDS`

## 2) Apply schema in Supabase

Run the SQL in `sql/schema.sql` inside Supabase SQL Editor.

## 3) Install and run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Auth model:
- Dashboard/control-plane endpoints use `Authorization: Bearer <user_token>`.
- Agent runtime endpoints continue to use `X-Agent-Token`.
- `X-Control-Plane-Token` should be reserved for trusted server-side machine-to-machine use only.

User token lifecycle endpoints:
- `POST /v1/user-token/issue` (`X-Control-Plane-Token` required) issues a new user token.
- `POST /v1/user-token/rotate` (`Authorization: Bearer <user_token>`) rotates the caller token.
- `POST /v1/user-token/revoke` (`Authorization: Bearer <user_token>`) revokes the caller token.

## Operator runbook: user token rotation

1. Initial issue (or break-glass re-issue) from a trusted server environment:

```bash
curl -sS -X POST http://localhost:8000/v1/user-token/issue \
  -H "X-Control-Plane-Token: $CONTROL_PLANE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

2. Rotate an active user token:

```bash
curl -sS -X POST http://localhost:8000/v1/user-token/rotate \
  -H "Authorization: Bearer $CURRENT_USER_TOKEN"
```

3. Revoke an active user token:

```bash
curl -i -X POST http://localhost:8000/v1/user-token/revoke \
  -H "Authorization: Bearer $CURRENT_USER_TOKEN"
```

After `issue` or `rotate`, store the returned `userToken` securely and update frontend/browser token storage.
