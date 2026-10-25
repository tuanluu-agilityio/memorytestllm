-- All client access goes through these security-definer functions.
-- "Valid" sessions (rank + stats): submitted, not replayed, 15 words, 1500 ms.

create or replace function public.start_session(p_show_ms int default 1500)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessions; ws text[];
begin
  select array_agg(word) into ws from (select word from public.words order by random() limit 15) w;
  insert into public.sessions (user_id, word_count, show_ms)
    values (auth.uid(), 15, p_show_ms) returning * into s;
  insert into public.session_items (session_id, position, word)
    select s.id, i, ws[i] from generate_subscripts(ws, 1) i;
  return jsonb_build_object('session_id', s.id, 'claim_token', s.claim_token, 'words', to_jsonb(ws));
end $$;

create or replace function public._owned_session(p_session_id uuid, p_claim_token uuid)
returns public.sessions language plpgsql security definer set search_path = public as $$
declare s public.sessions;
begin
  select * into s from public.sessions where id = p_session_id and claim_token = p_claim_token;
  if not found or (s.user_id is not null and s.user_id is distinct from auth.uid()) then
    raise exception 'invalid session';
  end if;
  return s;
end $$;

create or replace function public.submit_session(p_session_id uuid, p_claim_token uuid, p_typed text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.sessions; typed text[]; sc int; rec jsonb;
begin
  s := public._owned_session(p_session_id, p_claim_token);
  if s.submitted_at is not null then raise exception 'already submitted'; end if;

  select coalesce(array_agg(t), '{}') into typed from (
    select regexp_replace(t, '[^a-z]', '', 'g') t
    from regexp_split_to_table(lower(coalesce(p_typed, '')), '[\s,;]+') t
  ) x where t <> '';

  update public.session_items set recalled = (word = any(typed)) where session_id = s.id;
  select count(*) filter (where recalled), jsonb_agg(recalled order by position)
    into sc, rec from public.session_items where session_id = s.id;
  update public.sessions set score = sc, submitted_at = now() where id = s.id;
  return jsonb_build_object('score', sc, 'recalled', rec);
end $$;

create or replace function public.mark_replayed(p_session_id uuid, p_claim_token uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s public.sessions;
begin
  s := public._owned_session(p_session_id, p_claim_token);
  update public.sessions set replayed = true where id = s.id;
end $$;

create or replace function public.claim_session(p_session_id uuid, p_claim_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update public.sessions set user_id = auth.uid()
    where id = p_session_id and claim_token = p_claim_token and user_id is null
      and created_at > now() - interval '1 hour';
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.get_leaderboard()
returns table(rank int, display_name text, best_score int, games int, is_me boolean)
language sql stable security definer set search_path = public as $$
  with valid as (
    select user_id, score, submitted_at from public.sessions
    where user_id is not null and submitted_at is not null and not replayed
      and word_count = 15 and show_ms = 1500
  ), per_user as (
    select distinct on (user_id) user_id, score best, submitted_at at_time,
           count(*) over (partition by user_id) n
    from valid order by user_id, score desc, submitted_at asc
  )
  select (row_number() over (order by best desc, at_time asc))::int,
         split_part(u.email, '@', 1), best, n::int, p.user_id = auth.uid()
  from per_user p join auth.users u on u.id = p.user_id
  order by best desc, at_time asc
  limit 20
$$;

create or replace function public.get_my_history()
returns table(id uuid, created_at timestamptz, score int, replayed boolean)
language sql stable security definer set search_path = public as $$
  select id, created_at, score, replayed from public.sessions
  where user_id = auth.uid() and submitted_at is not null
  order by created_at desc
$$;

create or replace function public.get_my_position_stats()
returns table("position" int, recall_rate numeric, games int)
language sql stable security definer set search_path = public as $$
  with valid as (
    select id from public.sessions
    where user_id = auth.uid() and submitted_at is not null and not replayed
      and word_count = 15 and show_ms = 1500
  )
  select i.position, round(avg(i.recalled::int), 2), (select count(*) from valid)::int
  from public.session_items i join valid v on v.id = i.session_id
  group by i.position order by i.position
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.start_session(int), public.submit_session(uuid, uuid, text),
  public.mark_replayed(uuid, uuid), public.get_leaderboard(), public.get_my_history(),
  public.get_my_position_stats() to anon, authenticated;
grant execute on function public.claim_session(uuid, uuid) to authenticated;
