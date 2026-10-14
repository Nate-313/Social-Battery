-- Battery: Friends backend for Supabase.
-- Paste this whole file into your project's SQL Editor and click Run. Safe to re-run.
--
-- Security model: there are no user accounts. Each device makes a long random secret
-- and sends it with every call; only its SHA-256 hash is stored. Row level security is
-- on with no policies, so the public API key can't read or write the tables directly:
-- everything goes through the battery_* functions below, which only ever return a
-- friend's name, code and latest status (never secrets).

create extension if not exists pgcrypto with schema extensions;

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

create table if not exists public.battery_friendships (
  profile_id uuid not null references public.battery_profiles(id) on delete cascade,
  friend_id  uuid not null references public.battery_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, friend_id),
  check (profile_id <> friend_id)
);

alter table public.battery_profiles enable row level security;
alter table public.battery_friendships enable row level security;
revoke all on public.battery_profiles, public.battery_friendships from anon, authenticated;

-- Internal: profile id for a device secret, or an error.
create or replace function public.battery_me(p_secret text)
returns uuid language plpgsql stable security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  select id into v_id from battery_profiles where secret_hash = encode(digest(p_secret, 'sha256'), 'hex');
  if v_id is null then raise exception 'Sharing isn''t set up on this device yet'; end if;
  return v_id;
end $$;

-- Create or update this device's profile and latest status. Returns its friend code.
create or replace function public.battery_sync(
  p_secret text, p_name text, p_battery numeric, p_category text, p_is_flag boolean, p_logged_at timestamptz)
returns text language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_hash text;
  v_name text := btrim(coalesce(p_name, ''));
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O, 1/I/L
begin
  if p_secret is null or length(p_secret) < 32 then raise exception 'Invalid device secret'; end if;
  if length(v_name) < 1 or length(v_name) > 40 then raise exception 'Name must be 1–40 characters'; end if;
  if p_battery is not null and (p_battery < 0 or p_battery > 4) then raise exception 'Battery must be between 0 and 4'; end if;
  if length(p_category) > 40 then raise exception 'Activity name is too long'; end if;
  v_hash := encode(digest(p_secret, 'sha256'), 'hex');

  update battery_profiles
     set name = v_name, battery = p_battery, category = p_category,
         is_flag = coalesce(p_is_flag, false), logged_at = p_logged_at, updated_at = now()
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
  insert into battery_profiles (secret_hash, code, name, battery, category, is_flag, logged_at)
  values (v_hash, v_code, v_name, p_battery, p_category, coalesce(p_is_flag, false), p_logged_at);
  return v_code;
end $$;

-- Add a friend by code. Friendship is mutual. Returns the friend's name.
create or replace function public.battery_add_friend(p_secret text, p_code text)
returns text language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_me uuid := battery_me(p_secret);
  v_friend uuid;
  v_name text;
begin
  select id, name into v_friend, v_name from battery_profiles where code = upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g'));
  if v_friend is null then raise exception 'No one has that friend code'; end if;
  if v_friend = v_me then raise exception 'That''s your own code'; end if;
  if (select count(*) from battery_friendships where profile_id = v_me) >= 200 then raise exception 'Friend limit reached'; end if;
  insert into battery_friendships (profile_id, friend_id) values (v_me, v_friend), (v_friend, v_me) on conflict do nothing;
  return v_name;
end $$;

-- Remove a friend (both directions).
create or replace function public.battery_remove_friend(p_secret text, p_code text)
returns void language plpgsql volatile security definer set search_path = public, extensions as $$
declare v_me uuid := battery_me(p_secret);
begin
  delete from battery_friendships f using battery_profiles p
   where p.code = p_code
     and ((f.profile_id = v_me and f.friend_id = p.id) or (f.profile_id = p.id and f.friend_id = v_me));
end $$;

-- Friends' latest statuses.
create or replace function public.battery_friends(p_secret text)
returns table (code text, name text, battery numeric, category text, is_flag boolean, logged_at timestamptz)
language sql stable security definer set search_path = public, extensions as $$
  select p.code, p.name, p.battery, p.category, p.is_flag, p.logged_at
    from battery_friendships f join battery_profiles p on p.id = f.friend_id
   where f.profile_id = battery_me(p_secret)
   order by p.logged_at desc nulls last;
$$;

-- Delete this device's profile and friendships.
create or replace function public.battery_leave(p_secret text)
returns void language sql volatile security definer set search_path = public, extensions as $$
  delete from battery_profiles where id = battery_me(p_secret);
$$;

-- Only the public functions are callable with the API key.
revoke execute on function public.battery_me(text) from public, anon, authenticated;
revoke execute on function public.battery_sync(text, text, numeric, text, boolean, timestamptz) from public;
revoke execute on function public.battery_add_friend(text, text) from public;
revoke execute on function public.battery_remove_friend(text, text) from public;
revoke execute on function public.battery_friends(text) from public;
revoke execute on function public.battery_leave(text) from public;
grant execute on function public.battery_sync(text, text, numeric, text, boolean, timestamptz) to anon, authenticated;
grant execute on function public.battery_add_friend(text, text) to anon, authenticated;
grant execute on function public.battery_remove_friend(text, text) to anon, authenticated;
grant execute on function public.battery_friends(text) to anon, authenticated;
grant execute on function public.battery_leave(text) to anon, authenticated;
