create extension if not exists "pgcrypto";

do $$ begin
  create type party as enum ('Anidis', 'NedCargo', 'IJsvogel');
exception when duplicate_object then null; end $$;
do $$ begin
  create type user_role as enum ('superadmin', 'party_user');
exception when duplicate_object then null; end $$;
do $$ begin
  create type case_type as enum ('Routeafwijking', 'Palletafwijking', 'Ander');
exception when duplicate_object then null; end $$;
do $$ begin
  create type case_status as enum ('Pending', 'Approved', 'Rejected', 'Wijziging voorgesteld');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  party party not null,
  role user_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists client_map (
  client_number text primary key,
  client_name text not null,
  updated_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  type case_type not null,
  submission_time timestamptz not null default now(),
  submitted_by party not null,
  client_number text,
  client_name text,
  from_date date,
  to_date date,
  comment text not null,
  status case_status not null default 'Pending',
  decided_on timestamptz,
  decision_comment text,
  created_by_user_id uuid references users(id)
);

create table if not exists case_transitions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  previous_status case_status not null,
  next_status case_status not null,
  action text not null,
  action_comment text,
  performed_by_user_id uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table if not exists notification_settings (
  id uuid primary key default gen_random_uuid(),
  event_code text unique not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists notification_recipients (
  id uuid primary key default gen_random_uuid(),
  event_code text not null,
  party party,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_id text,
  detail text,
  performed_by_user_id uuid references users(id),
  created_at timestamptz not null default now()
);
