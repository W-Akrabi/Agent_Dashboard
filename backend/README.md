# Jarvis Backend (FastAPI + Supabase)

## Setup

Follow these steps to get the backend running:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema** — Open the Supabase SQL Editor and execute all SQL from `backend/sql/schema.sql`

3. **Enable Realtime** on the following tables:
   - Go to Supabase Dashboard → Table Editor
   - Select each table (`events`, `tasks`, `agents`)
   - Toggle the "Realtime" switch ON

4. **Copy `.env.example` and fill in values**:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Then open `.env` and fill in the values from your Supabase Dashboard:
   - `SUPABASE_DB_HOST`, `SUPABASE_DB_PASSWORD` — Supabase Dashboard → Settings → Database
   - `SUPABASE_JWT_SECRET` — Supabase Dashboard → Settings → API
   - `CONTROL_PLANE_TOKEN` — Generate a strong random secret (for server-side privileged operations)

5. **Set up frontend `.env`**:
   ```bash
   cd frontend
   cp .env.example .env
   ```
   Fill in values from Supabase Dashboard → Settings → API:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

6. **Install and start the backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`

7. **Start the frontend** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

8. **Sign up via the app** — When you create an account, a user profile is automatically created in the database via the `handle_new_user` trigger.

---

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
