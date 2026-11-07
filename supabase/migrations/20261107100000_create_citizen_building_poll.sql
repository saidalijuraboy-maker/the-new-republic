create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  option_id text not null check (option_id in ('mosque', 'cinema', 'amusement_park', 'riverside_resort')),
  created_at timestamptz not null default now(),
  constraint poll_votes_one_vote_per_citizen unique (citizen_id)
);

alter table public.poll_votes enable row level security;
revoke all on table public.poll_votes from anon, authenticated;

create or replace function public.cast_poll_vote(
  p_username text,
  p_platform text,
  p_option_id text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_username text;
  v_platform text;
  v_citizen_id uuid;
begin
  v_platform := lower(coalesce(btrim(p_platform), ''));
  v_username := lower(regexp_replace(btrim(coalesce(p_username, '')), '^@', ''));

  if v_platform not in ('tiktok', 'instagram') then
    raise exception 'INVALID_PLATFORM';
  end if;

  if p_option_id not in ('mosque', 'cinema', 'amusement_park', 'riverside_resort') then
    raise exception 'INVALID_OPTION';
  end if;

  if v_username = '' then
    raise exception 'INVALID_USERNAME';
  end if;

  select c.id into v_citizen_id
  from public.citizens c
  where c.username_normalized = v_username
    and c.platform = v_platform
  limit 1;

  if v_citizen_id is null then
    raise exception 'CITIZEN_NOT_FOUND';
  end if;

  insert into public.poll_votes (citizen_id, option_id)
  values (v_citizen_id, p_option_id);

  return 'OK';
exception
  when unique_violation then
    raise exception 'ALREADY_VOTED';
end;
$$;

create or replace function public.get_poll_results()
returns table(option_id text, vote_count bigint, total_votes bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with options(option_id, sort_order) as (
    values
      ('mosque'::text, 1),
      ('cinema'::text, 2),
      ('amusement_park'::text, 3),
      ('riverside_resort'::text, 4)
  ),
  counts as (
    select pv.option_id, count(*)::bigint as vote_count
    from public.poll_votes pv
    group by pv.option_id
  ),
  total as (
    select count(*)::bigint as total_votes from public.poll_votes
  )
  select o.option_id, coalesce(c.vote_count, 0)::bigint, t.total_votes
  from options o
  left join counts c on c.option_id = o.option_id
  cross join total t
  order by o.sort_order;
$$;

revoke all on function public.cast_poll_vote(text, text, text) from public;
revoke all on function public.get_poll_results() from public;
grant execute on function public.cast_poll_vote(text, text, text) to anon, authenticated;
grant execute on function public.get_poll_results() to anon, authenticated;
