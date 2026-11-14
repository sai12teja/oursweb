-- Contact-form messages and newsletter sign-ups (POST /api/enquiry).
-- Run in the Supabase SQL editor, or via `supabase db push`.

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'contact',   -- 'contact' | 'newsletter'
  name text,
  email text not null,
  phone text,
  service text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx on enquiries (created_at desc);

-- Written by the server with the service_role key (bypasses RLS). RLS stays
-- on so the public key cannot read or write this table.
alter table enquiries enable row level security;
