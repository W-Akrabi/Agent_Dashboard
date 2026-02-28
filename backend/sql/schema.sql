-- Jarvis Mission Control schema for Supabase Postgres
-- Apply in Supabase SQL Editor before running the backend.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  workspace_id uuid not null default gen_random_uuid(),
  api_token_hash text unique,
  api_token_issued_at timestamptz,
  api_token_last_rotated_at timestamptz,
  api_token_revoked_at timestamptz,
  api_token_last_used_at timestamptz,
  monthly_budget numeric(12,2) not null default 1000,
  created_at timestamptz not null default now()
);

alter table users add column if not exists workspace_id uuid;
alter table users alter column workspace_id set default gen_random_uuid();
update users
set workspace_id = gen_random_uuid()
where workspace_id is null;
alter table users alter column workspace_id set not null;
alter table users add column if not exists api_token_hash text;
alter table users add column if not exists api_token_issued_at timestamptz;
alter table users add column if not exists api_token_last_rotated_at timestamptz;
alter table users add column if not exists api_token_revoked_at timestamptz;
alter table users add column if not exists api_token_last_used_at timestamptz;
update users
set api_token_issued_at = coalesce(api_token_issued_at, created_at)
where api_token_hash is not null
  and api_token_issued_at is null;

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users(id) on delete set null,
  workspace_id uuid not null,
  name text not null,
  description text,
  status text not null default 'idle'
    check (status in ('running', 'idle', 'paused', 'error', 'waiting_approval')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table agents add column if not exists owner_user_id uuid references users(id) on delete set null;
alter table agents add column if not exists workspace_id uuid;
update agents
set workspace_id = (
  select coalesce(
    (
      select u.workspace_id
      from users u
      order by u.created_at asc
      limit 1
    ),
    gen_random_uuid()
  )
)
where workspace_id is null;
alter table agents alter column workspace_id set not null;

create index if not exists idx_agents_workspace_created_at
  on agents(workspace_id, created_at desc);

create index if not exists idx_agents_owner_user
  on agents(owner_user_id);

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

create unique index if not exists idx_commands_one_decision_per_source_task
  on commands(source_task_id)
  where source_task_id is not null and kind = 'approval_decision';

insert into users (email, monthly_budget)
values ('owner@jarvis.local', 1000)
on conflict (email) do nothing;
