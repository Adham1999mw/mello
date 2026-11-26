-- =====================================================================
-- Customer accounts: profiles + addresses
-- =====================================================================
-- Run AFTER 20261125020000_admin.sql, in Dashboard -> SQL Editor.
--
-- How it works
--   1. A customer signs up on /ar/sign-up/ (email + password) or with Google.
--      Supabase Auth creates the row in auth.users.
--   2. The trigger below creates their row in public.profiles from the sign-up data
--      (full name from our form, or the name from Google).
--   3. RLS: every customer can read and change only their own profile and addresses.
--
-- Admin access is NOT affected: being an admin means having a row in public.admins,
-- and nobody can add one through the API (only you, in the SQL Editor). A customer
-- account is just a normal logged-in user, so is_admin() stays false for it.
-- Do not add an "is_admin" or "role" column to profiles: customers can edit their profile.
-- =====================================================================

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- profiles ----------
-- One row per account, same id as auth.users. The email stays in auth.users.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  -- Egyptian mobile, 11 digits, e.g. 01012345678. Required on the email sign-up form
  -- (src/lib/auth signUp). Google sign-ups start without one and give it at checkout.
  phone       text check (phone ~ '^01[0125][0-9]{8}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Customers read their profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Customers update their profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Rows are created by the trigger only; customers can change just these columns.
-- (Supabase grants everything on new tables by default, so take that back first.)
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Admins can see customers (for orders later). Read only.
create policy "Admins read profiles"
  on public.profiles for select to authenticated
  using ((select public.is_admin()));

-- ---------- create the profile on sign-up (email or Google) ----------
-- Email sign-up sends { full_name, phone } as user metadata (see src/lib/auth; the form requires the phone).
-- Google sends { full_name / name } (its photo is not saved).
-- A bad phone value is dropped instead of blocking the sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  phone text  := nullif(meta ->> 'phone', '');
begin
  if phone is not null and phone !~ '^01[0125][0-9]{8}$' then
    phone := null;
  end if;

  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(nullif(coalesce(meta ->> 'full_name', meta ->> 'name'), ''), 120),
    phone
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts made before this migration (your admin account) get a profile too.
insert into public.profiles (id, full_name)
select u.id, nullif(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), '')
from auth.users u
on conflict (id) do nothing;

-- ---------- addresses ----------
-- A customer can save several delivery addresses; one of them is the default.
create table public.addresses (
  id              bigint generated always as identity primary key,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label           text check (char_length(label) <= 40),          -- "Home", "Work"
  recipient_name  text not null check (char_length(recipient_name) between 1 and 120),
  phone           text not null check (phone ~ '^01[0125][0-9]{8}$'),
  governorate     text not null check (char_length(governorate) between 1 and 60),   -- e.g. Cairo
  city            text not null check (char_length(city) between 1 and 80),          -- city / area, e.g. Nasr City
  street          text not null check (char_length(street) between 1 and 200),
  building        text check (char_length(building) <= 40),
  floor           text check (char_length(floor) <= 20),
  apartment       text check (char_length(apartment) <= 20),
  landmark        text check (char_length(landmark) <= 200),       -- "next to the pharmacy"
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
-- At most one default address per customer.
create unique index addresses_one_default_idx on public.addresses (user_id) where is_default;

alter table public.addresses enable row level security;

create policy "Customers manage their addresses"
  on public.addresses for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Admins read addresses"
  on public.addresses for select to authenticated
  using ((select public.is_admin()));

revoke all on public.addresses from anon, authenticated;
grant select, insert, delete on public.addresses to authenticated;
grant update (label, recipient_name, phone, governorate, city, street, building, floor,
              apartment, landmark, is_default) on public.addresses to authenticated;

create trigger addresses_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();
