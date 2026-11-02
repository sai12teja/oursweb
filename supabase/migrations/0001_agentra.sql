-- Agentra chatbot schema. Run in Supabase SQL editor, or via:
--   supabase db push   (after `supabase link --project-ref <ref>`)

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  date date not null,
  time text not null,
  reason text,
  conversation_id text,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id text primary key,
  messages jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists appointments_created_at_idx on appointments (created_at desc);

-- The server uses the service_role key, which bypasses RLS. Enable RLS so the
-- anon/public key cannot read or write these tables directly.
alter table appointments enable row level security;
alter table conversations enable row level security;
