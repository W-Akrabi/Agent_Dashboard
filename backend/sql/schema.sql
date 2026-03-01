-- Jarvis Mission Control — Supabase schema
-- Run once in the Supabase SQL Editor on a fresh project.
-- Idempotent: safe to re-run (uses CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, etc.)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- public.users
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  workspace_id uuid NOT NULL DEFAULT gen_random_uuid(),
  monthly_budget numeric(12,2) NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- handle_new_user function and trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users(id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- agents
-- ============================================================================

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'idle'
    CHECK (status IN ('running', 'idle', 'paused', 'error', 'waiting_approval')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_workspace_created_at
  ON agents(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agents_owner_user
  ON agents(owner_user_id);

-- ============================================================================
-- agent_tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_tokens_one_active
  ON agent_tokens(agent_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agent_tokens_hash_active
  ON agent_tokens(token_hash)
  WHERE revoked_at IS NULL;

-- ============================================================================
-- events
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('action', 'completion', 'error', 'tool_call', 'approval_request')),
  message text NOT NULL,
  cost numeric(12,6) NOT NULL DEFAULT 0,
  requires_approval boolean NOT NULL DEFAULT false,
  proposed_action text,
  completed_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Migration: Add workspace_id (nullable first, then backfill, then NOT NULL)
ALTER TABLE events ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- Backfill workspace_id from agents for existing rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM events WHERE workspace_id IS NULL LIMIT 1) THEN
    UPDATE events
    SET workspace_id = (SELECT workspace_id FROM agents WHERE id = agent_id)
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Apply NOT NULL constraint after backfill
ALTER TABLE events ALTER COLUMN workspace_id SET NOT NULL;

-- Create indexes after column is guaranteed to exist and be populated
CREATE INDEX IF NOT EXISTS idx_events_agent_created_at
  ON events(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_created_at
  ON events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_workspace_created_at
  ON events(workspace_id, created_at DESC);

-- ============================================================================
-- tasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  proposed_action text NOT NULL,
  completed_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

-- Migration: Add workspace_id (nullable first, then backfill, then NOT NULL)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- Backfill workspace_id from agents for existing rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM tasks WHERE workspace_id IS NULL LIMIT 1) THEN
    UPDATE tasks
    SET workspace_id = (SELECT workspace_id FROM agents WHERE id = agent_id)
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Apply NOT NULL constraint after backfill
ALTER TABLE tasks ALTER COLUMN workspace_id SET NOT NULL;

-- Create indexes after column is guaranteed to exist and be populated
CREATE INDEX IF NOT EXISTS idx_tasks_status_created_at
  ON tasks(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_agent_status
  ON tasks(agent_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status_created_at
  ON tasks(workspace_id, status, created_at DESC);

-- ============================================================================
-- commands
-- ============================================================================

CREATE TABLE IF NOT EXISTS commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  source_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'approval_decision',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'acked', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  acked_at timestamptz
);

-- Migration: Add workspace_id (nullable first, then backfill, then NOT NULL)
ALTER TABLE commands ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- Backfill workspace_id from agents for existing rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM commands WHERE workspace_id IS NULL LIMIT 1) THEN
    UPDATE commands
    SET workspace_id = (SELECT workspace_id FROM agents WHERE id = agent_id)
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Apply NOT NULL constraint after backfill
ALTER TABLE commands ALTER COLUMN workspace_id SET NOT NULL;

-- Create indexes after column is guaranteed to exist and be populated
CREATE INDEX IF NOT EXISTS idx_commands_agent_status_created
  ON commands(agent_id, status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_commands_workspace_status_created
  ON commands(workspace_id, status, created_at ASC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_commands_one_decision_per_source_task
  ON commands(source_task_id)
  WHERE source_task_id IS NOT NULL AND kind = 'approval_decision';

-- ============================================================================
-- Triggers: Auto-populate workspace_id from agents (backward compatibility)
-- ============================================================================

-- Trigger for events: populate workspace_id from agents.workspace_id when omitted
CREATE OR REPLACE FUNCTION public.events_populate_workspace_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id FROM agents WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS events_populate_workspace_id ON events;
CREATE TRIGGER events_populate_workspace_id
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE PROCEDURE public.events_populate_workspace_id();

-- Trigger for tasks: populate workspace_id from agents.workspace_id when omitted
CREATE OR REPLACE FUNCTION public.tasks_populate_workspace_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id FROM agents WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tasks_populate_workspace_id ON tasks;
CREATE TRIGGER tasks_populate_workspace_id
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.tasks_populate_workspace_id();

-- Trigger for commands: populate workspace_id from agents.workspace_id when omitted
CREATE OR REPLACE FUNCTION public.commands_populate_workspace_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id FROM agents WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS commands_populate_workspace_id ON commands;
CREATE TRIGGER commands_populate_workspace_id
  BEFORE INSERT ON commands
  FOR EACH ROW
  EXECUTE PROCEDURE public.commands_populate_workspace_id();

-- ============================================================================
-- Realtime configuration
-- ============================================================================

ALTER TABLE events REPLICA IDENTITY FULL;
ALTER TABLE tasks  REPLICA IDENTITY FULL;
ALTER TABLE agents REPLICA IDENTITY FULL;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE agents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_select" ON agents;
CREATE POLICY "workspace_select" ON agents
  FOR SELECT USING (
    workspace_id = (SELECT workspace_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "workspace_select" ON events;
CREATE POLICY "workspace_select" ON events
  FOR SELECT USING (
    workspace_id = (SELECT workspace_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "workspace_select" ON tasks;
CREATE POLICY "workspace_select" ON tasks
  FOR SELECT USING (
    workspace_id = (SELECT workspace_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "workspace_select" ON commands;
CREATE POLICY "workspace_select" ON commands
  FOR SELECT USING (
    workspace_id = (SELECT workspace_id FROM public.users WHERE id = auth.uid())
  );
