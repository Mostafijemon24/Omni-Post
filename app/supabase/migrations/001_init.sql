-- OmniPost AI: initial schema. Run in Supabase → SQL Editor (safe to run again).
-- The app talks to these tables only from the server with the service-role key, so Row Level
-- Security is switched on with no policies: the public anon key can read or write nothing.

create extension if not exists pgcrypto;

create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  platform      text not null check (platform in ('facebook','instagram','linkedin','x','threads','youtube','tiktok','pinterest','reddit','telegram')),
  account       text,
  headline      text,
  caption       text not null default '',
  hashtags      text[] not null default '{}',
  cta           text,
  image_alt     text,
  status        text not null default 'draft' check (status in ('draft','scheduled','approval','published','failed')),
  scheduled_at  timestamptz,
  timezone      text,
  source        text not null default 'Content Studio',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists posts_status_idx on public.posts (status, scheduled_at);
create index if not exists posts_created_idx on public.posts (created_at desc);

-- OAuth 2.1 for MCP clients (Claude, ChatGPT, …). Codes and tokens are stored only as SHA-256 hashes.
create table if not exists public.oauth_clients (
  client_id      text primary key,
  client_name    text not null default 'MCP client',
  redirect_uris  text[] not null,
  created_at     timestamptz not null default now()
);

create table if not exists public.oauth_codes (
  code_hash       text primary key,
  client_id       text not null references public.oauth_clients(client_id) on delete cascade,
  redirect_uri    text not null,
  code_challenge  text not null,
  scope           text,
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

create table if not exists public.oauth_tokens (
  token_hash   text primary key,
  kind         text not null check (kind in ('access','refresh')),
  client_id    text not null references public.oauth_clients(client_id) on delete cascade,
  scope        text,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
create index if not exists oauth_tokens_client_idx on public.oauth_tokens (client_id);

alter table public.posts         enable row level security;
alter table public.oauth_clients enable row level security;
alter table public.oauth_codes   enable row level security;
alter table public.oauth_tokens  enable row level security;

-- Supabase no longer exposes new public tables to the Data API automatically, not even to the
-- service role: without these grants every call from the server fails with "permission denied".
grant usage on schema public to service_role;
grant select, insert, update, delete on public.posts, public.oauth_clients, public.oauth_codes, public.oauth_tokens to service_role;
notify pgrst, 'reload schema';
