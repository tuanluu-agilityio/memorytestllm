-- Tables are private: only security-definer RPCs (see _rpc.sql) touch them.

create table public.words (
  id serial primary key,
  word text not null unique check (word ~ '^[a-z]+$'),
  topic text not null
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  claim_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  word_count int not null,
  show_ms int not null,
  score int,
  replayed boolean not null default false
);
create index sessions_user_id_idx on public.sessions (user_id);

create table public.session_items (
  session_id uuid not null references public.sessions on delete cascade,
  position int not null,
  word text not null,
  recalled boolean,
  primary key (session_id, position)
);

alter table public.words enable row level security;
alter table public.sessions enable row level security;
alter table public.session_items enable row level security;

revoke all on public.words, public.sessions, public.session_items from anon, authenticated;
