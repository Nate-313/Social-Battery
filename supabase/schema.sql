-- Battery: Friends backend for Supabase.
-- Paste this whole file into your project's SQL Editor and click Run.
-- Safe to re-run: it keeps existing profiles, friends and messages, and updates the functions.
--
-- Security model: there are no user accounts. Each device makes a long random secret
-- and sends it with every call; only its SHA-256 hash is stored. Row level security is
-- on with no policies, so the public API key can't read or write the tables directly:
-- everything goes through the battery_* functions below, which never return secrets.

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tables ----------
create table if not exists public.battery_profiles (
  id          uuid primary key default gen_random_uuid(),
  secret_hash text not null unique,
  code        text not null unique,
  name        text not null,
  battery     numeric,
  category    text,
  is_flag     boolean not null default false,
  logged_at   timestamptz,
  updated_at  timestamptz not null default now()
);
alter table public.battery_profiles add column if not exists avatar text not null default '🦊';
alter table public.battery_profiles add column if not exists flags jsonb not null default '[]'::jsonb; -- recent red flags: [{at, note}]

-- Accepted friendships, stored once in each direction.
create table if not exists public.battery_friendships (
  profile_id uuid not null references public.battery_profiles(id) on delete cascade,
  friend_id  uuid not null references public.battery_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, friend_id),
  check (profile_id <> friend_id)
);

-- Pending friend requests (from_id asked to_id).
create table if not exists public.battery_requests (
  from_id    uuid not null references public.battery_profiles(id) on delete cascade,
  to_id      uuid not null references public.battery_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

create table if not exists public.battery_messages (
  id           bigint generated always as identity primary key,
  sender_id    uuid not null references public.battery_profiles(id) on delete cascade,
  recipient_id uuid not null references public.battery_profiles(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);
create index if not exists battery_messages_pair on public.battery_messages
  (least(sender_id, recipient_id), greatest(sender_id, recipient_id), id);
create index if not exists battery_messages_unread on public.battery_messages (recipient_id) where read_at is null;

alter table public.battery_profiles    enable row level security;
alter table public.battery_friendships enable row level security;
alter table public.battery_requests    enable row level security;
alter table public.battery_messages    enable row level security;
revoke all on public.battery_profiles, public.battery_friendships, public.battery_requests, public.battery_messages
  from anon, authenticated;

-- ---------- Functions ----------
-- Drop every earlier version first so changed signatures don't leave old copies behind.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'battery\_%' loop
    execute 'drop function ' || f.sig;
  end loop;
end $$;

-- Internal: profile id for a device secret, or an error.
create function public.battery_me(p_secret text)
returns uuid language plpgsql stable security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  select id into v_id from battery_profiles where secret_hash = encode(digest(coalesce(p_secret, ''), 'sha256'), 'hex');
  if v_id is null then raise exception 'Sharing isn''t set up on this device yet'; end if;
  return v_id;
end $$;

-- Internal: profile id for a friend code, or an error.
create function public.battery_by_code(p_code text)
returns uuid language plpgsql stable security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  select id into v_id from battery_profiles where code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if v_id is null then raise exception 'No one has that friend code'; end if;
  return v_id;
end $$;

-- Internal: make two people friends and clear any requests between them.
create function public.battery_befriend(p_a uuid, p_b uuid)
returns void language sql volatile security definer set search_path = public, extensions as $$
  insert into battery_friendships (profile_id, friend_id) values (p_a, p_b), (p_b, p_a) on conflict do nothing;
  delete from battery_requests where (from_id = p_a and to_id = p_b) or (from_id = p_b and to_id = p_a);
$$;

-- Create or update this device's profile and status. Returns its friend code.
-- p_flags: this person's recent red flags, [{at, note}], newest first.
create function public.battery_sync(
  p_secret text, p_name text, p_avatar text, p_battery numeric, p_category text,
  p_is_flag boolean, p_logged_at timestamptz, p_flags jsonb)
returns text language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_hash text;
  v_name text := btrim(coalesce(p_name, ''));
  v_avatar text := btrim(coalesce(p_avatar, ''));
  v_flags jsonb;
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O, 1/I/L
begin
  if p_secret is null or length(p_secret) < 32 then raise exception 'Invalid device secret'; end if;
  if length(v_name) < 1 or length(v_name) > 40 then raise exception 'Name must be 1–40 characters'; end if;
  if length(v_avatar) < 1 or length(v_avatar) > 16 then raise exception 'Pick an animal'; end if;
  if p_battery is not null and (p_battery < 0 or p_battery > 4) then raise exception 'Battery must be between 0 and 4'; end if;
  if length(p_category) > 40 then raise exception 'Activity name is too long'; end if;
  if p_flags is not null and (jsonb_typeof(p_flags) <> 'array' or jsonb_array_length(p_flags) > 100) then
    raise exception 'Invalid red flag list';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('at', t.at, 'note', t.note) order by t.at desc), '[]'::jsonb) into v_flags
    from (select (f->>'at')::timestamptz as at, nullif(left(btrim(coalesce(f->>'note', '')), 500), '') as note
            from jsonb_array_elements(coalesce(p_flags, '[]'::jsonb)) f) t;
  v_hash := encode(digest(p_secret, 'sha256'), 'hex');

  update battery_profiles
     set name = v_name, avatar = v_avatar, battery = p_battery, category = p_category,
         is_flag = coalesce(p_is_flag, false), logged_at = p_logged_at, flags = v_flags, updated_at = now()
   where secret_hash = v_hash
  returning code into v_code;
  if v_code is not null then return v_code; end if;

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % length(v_alphabet)), 1);
    end loop;
    exit when not exists (select 1 from battery_profiles where code = v_code);
  end loop;
  insert into battery_profiles (secret_hash, code, name, avatar, battery, category, is_flag, logged_at, flags)
  values (v_hash, v_code, v_name, v_avatar, p_battery, p_category, coalesce(p_is_flag, false), p_logged_at, v_flags);
  return v_code;
end $$;

-- Ask to be friends. If they already asked you, you become friends right away.
-- Returns {"status": "requested" | "friends", "name": "..."}.
create function public.battery_request_friend(p_secret text, p_code text)
returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_me uuid := battery_me(p_secret);
  v_them uuid := battery_by_code(p_code);
  v_name text;
begin
  if v_them = v_me then raise exception 'That''s your own code'; end if;
  select name into v_name from battery_profiles where id = v_them;
  if exists (select 1 from battery_friendships where profile_id = v_me and friend_id = v_them) then
    return jsonb_build_object('status', 'friends', 'name', v_name);
  end if;
  if exists (select 1 from battery_requests where from_id = v_them and to_id = v_me) then
    perform battery_befriend(v_me, v_them);
    return jsonb_build_object('status', 'friends', 'name', v_name);
  end if;
  if (select count(*) from battery_friendships where profile_id = v_me) >= 200 then raise exception 'Friend limit reached'; end if;
  if (select count(*) from battery_requests where from_id = v_me) >= 50 then raise exception 'Too many requests waiting. Cancel some first'; end if;
  insert into battery_requests (from_id, to_id) values (v_me, v_them) on conflict do nothing;
  return jsonb_build_object('status', 'requested', 'name', v_name);
end $$;

-- Accept someone's request. Returns their name.
create function public.battery_accept_request(p_secret text, p_code text)
returns text language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_me uuid := battery_me(p_secret);
  v_them uuid := battery_by_code(p_code);
begin
  if not exists (select 1 from battery_requests where from_id = v_them and to_id = v_me) then
    raise exception 'That request is no longer available';
  end if;
  perform battery_befriend(v_me, v_them);
  return (select name from battery_profiles where id = v_them);
end $$;

-- Decline an incoming request or cancel an outgoing one.
create function public.battery_remove_request(p_secret text, p_code text)
returns void language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_me uuid := battery_me(p_secret);
  v_them uuid := battery_by_code(p_code);
begin
  delete from battery_requests where (from_id = v_me and to_id = v_them) or (from_id = v_them and to_id = v_me);
end $$;

-- Pending requests, both directions.
create function public.battery_requests_list(p_secret text)
returns table (code text, name text, avatar text, incoming boolean, created_at timestamptz)
language sql stable security definer set search_path = public, extensions as $$
  with me as (select battery_me(p_secret) as id)
  select p.code, p.name, p.avatar, r.to_id = me.id, r.created_at
    from battery_requests r cross join me
    join battery_profiles p on p.id = case when r.to_id = me.id then r.from_id else r.to_id end
   where r.to_id = me.id or r.from_id = me.id
   order by r.created_at desc;
$$;

-- Unfriend (both directions).
create function public.battery_remove_friend(p_secret text, p_code text)
returns void language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_me uuid := battery_me(p_secret);
  v_them uuid := battery_by_code(p_code);
begin
  delete from battery_friendships where (profile_id = v_me and friend_id = v_them) or (profile_id = v_them and friend_id = v_me);
  delete from battery_requests where (from_id = v_me and to_id = v_them) or (from_id = v_them and to_id = v_me);
end $$;

-- Friends' latest statuses, red flags from the past 14 days, and unread message counts.
create function public.battery_friends(p_secret text)
returns table (code text, name text, avatar text, battery numeric, category text, is_flag boolean,
               logged_at timestamptz, flags jsonb, unread int)
language sql stable security definer set search_path = public, extensions as $$
  with me as (select battery_me(p_secret) as id)
  select p.code, p.name, p.avatar, p.battery, p.category, p.is_flag, p.logged_at,
         coalesce((select jsonb_agg(x) from jsonb_array_elements(p.flags) x
                    where (x->>'at')::timestamptz > now() - interval '14 days'), '[]'::jsonb),
         (select count(*) from battery_messages m
           where m.sender_id = p.id and m.recipient_id = me.id and m.read_at is null)::int
    from battery_friendships f cross join me
    join battery_profiles p on p.id = f.friend_id
   where f.profile_id = me.id
   order by p.logged_at desc nulls last;
$$;

-- Friends of your friends you aren't connected to yet, with who you have in common.
create function public.battery_suggestions(p_secret text)
returns table (code text, name text, avatar text, mutuals int, mutual_names text[])
language sql stable security definer set search_path = public, extensions as $$
  with me as (select battery_me(p_secret) as id),
  mine as (select f.friend_id from battery_friendships f, me where f.profile_id = me.id),
  fof as (select f2.friend_id as cand, f2.profile_id as via
            from battery_friendships f2 where f2.profile_id in (select friend_id from mine))
  select p.code, p.name, p.avatar, count(*)::int, (array_agg(v.name order by v.name))[1:3]
    from fof cross join me
    join battery_profiles p on p.id = fof.cand
    join battery_profiles v on v.id = fof.via
   where fof.cand <> me.id
     and fof.cand not in (select friend_id from mine)
     and not exists (select 1 from battery_requests r
                      where (r.from_id = me.id and r.to_id = fof.cand) or (r.from_id = fof.cand and r.to_id = me.id))
   group by p.id, p.code, p.name, p.avatar
   order by count(*) desc, p.name
   limit 20;
$$;

-- Send a message to a friend. Returns the new message's id.
create function public.battery_send_message(p_secret text, p_code text, p_body text)
returns bigint language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_me uuid := battery_me(p_secret);
  v_them uuid := battery_by_code(p_code);
  v_body text := btrim(coalesce(p_body, ''));
  v_id bigint;
begin
  if not exists (select 1 from battery_friendships where profile_id = v_me and friend_id = v_them) then
    raise exception 'You can only message friends';
  end if;
  if length(v_body) < 1 then raise exception 'Message is empty'; end if;
  if length(v_body) > 1000 then raise exception 'Message is too long (1000 characters max)'; end if;
  if (select count(*) from battery_messages where sender_id = v_me and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'You''re sending messages too fast. Wait a moment';
  end if;
  insert into battery_messages (sender_id, recipient_id, body) values (v_me, v_them, v_body) returning id into v_id;
  return v_id;
end $$;

-- The latest 200 messages with a friend (oldest first). Marks their messages to you as read.
create function public.battery_get_messages(p_secret text, p_code text)
returns table (id bigint, mine boolean, body text, created_at timestamptz, seen boolean)
language plpgsql volatile security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare
  v_me uuid := battery_me(p_secret);
  v_them uuid := battery_by_code(p_code);
begin
  if not exists (select 1 from battery_friendships where profile_id = v_me and friend_id = v_them) then
    raise exception 'You can only message friends';
  end if;
  update battery_messages set read_at = now()
   where sender_id = v_them and recipient_id = v_me and read_at is null;
  return query
    select m.id, m.sender_id = v_me, m.body, m.created_at, m.read_at is not null
      from (select * from battery_messages b
             where least(b.sender_id, b.recipient_id) = least(v_me, v_them)
               and greatest(b.sender_id, b.recipient_id) = greatest(v_me, v_them)
             order by b.id desc limit 200) m
     order by m.id;
end $$;

-- Delete this device's profile, friendships, requests and messages.
create function public.battery_leave(p_secret text)
returns void language sql volatile security definer set search_path = public, extensions as $$
  delete from battery_profiles where id = battery_me(p_secret);
$$;

-- ---------- Permissions ----------
-- Only the public functions are callable with the API key.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'battery\_%' loop
    execute 'revoke execute on function ' || f.sig || ' from public, anon, authenticated';
    if f.proname not in ('battery_me', 'battery_by_code', 'battery_befriend') then
      execute 'grant execute on function ' || f.sig || ' to anon, authenticated';
    end if;
  end loop;
end $$;
