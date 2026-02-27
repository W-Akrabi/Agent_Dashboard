# Jarvis Backend (FastAPI + Supabase)

## 1) Configure environment

```bash
cd backend
cp .env.example .env
```

Set either `DATABASE_URL` or the `SUPABASE_DB_*` fields in `.env`.

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
