-- OmniPost AI: REST API tokens (for n8n, Make, scripts) and publish results reported back by automations.
-- Run once in Supabase → SQL Editor, after 001_init.sql.

create table if not exists public.api_tokens (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  token_hash    text not null unique,
  prefix        text not null,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);
alter table public.api_tokens enable row level security;

alter table public.posts add column if not exists published_url text;
alter table public.posts add column if not exists published_at  timestamptz;
alter table public.posts add column if not exists last_error    text;
