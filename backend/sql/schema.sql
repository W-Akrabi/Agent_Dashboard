-- Jarvis Mission Control schema for Supabase Postgres
-- Apply in Supabase SQL Editor before running the backend.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  monthly_budget numeric(12,2) not null default 1000,
  created_at timestamptz not null default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'idle'
    check (status in ('running', 'idle', 'paused', 'error', 'waiting_approval')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists agent_tokens (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists idx_agent_tokens_one_active
  on agent_tokens(agent_id)
  where revoked_at is null;

create index if not exists idx_agent_tokens_hash_active
  on agent_tokens(token_hash)
  where revoked_at is null;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  type text not null check (type in ('action', 'completion', 'error', 'tool_call', 'approval_request')),
  message text not null,
  cost numeric(12,6) not null default 0,
  requires_approval boolean not null default false,
  proposed_action text,
  completed_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_agent_created_at
  on events(agent_id, created_at desc);

create index if not exists idx_events_created_at
  on events(created_at desc);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  proposed_action text not null,
  completed_actions jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  comment text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists idx_tasks_status_created_at
  on tasks(status, created_at desc);

create index if not exists idx_tasks_agent_status
  on tasks(agent_id, status);

create table if not exists commands (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  source_task_id uuid references tasks(id) on delete set null,
  kind text not null default 'approval_decision',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'acked', 'expired')),
  created_at timestamptz not null default now(),
  acked_at timestamptz
);

create index if not exists idx_commands_agent_status_created
  on commands(agent_id, status, created_at asc);

insert into users (email, monthly_budget)
values ('owner@jarvis.local', 1000)
on conflict (email) do nothing;
