-- =====================================================================
-- Product reviews: stars + a comment
-- =====================================================================
-- Run this in Supabase (SQL Editor → New query → paste → Run) AFTER
-- 20261127000000_customers.sql and 20261128000000_product_specs.sql.
--
-- How it works
--   1. A signed-in customer writes ONE review per product: a rating (1 to 5)
--      and her comment. It is saved as 'pending'.
--   2. An admin approves (or rejects) it. Only 'approved' reviews are public.
--   3. Her name is copied from her profile (profiles.full_name) when she writes it.
--   4. "Verified buyer" (is_verified) is set by an admin for now; it becomes
--      automatic when we have an orders table.
--   5. If she edits her review, it goes back to 'pending' until an admin approves it again.
--
-- Reading (no login needed):
--   product_review_stats   view: count, average and stars breakdown per product
--   list_reviews(...)      approved reviews of a product, sorted and paged
--   my_review(slug)        the signed-in customer's own review of a product (any status)
--
-- Who wrote a review (user_id) is never shown to visitors.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------
create table public.reviews (
  id            bigint generated always as identity primary key,
  product_id    bigint not null references public.products (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  display_name  text check (char_length(display_name) <= 120),   -- copied from the profile
  rating        smallint not null check (rating between 1 and 5),
  body          text not null check (char_length(btrim(body)) between 10 and 2000),
  is_verified   boolean not null default false,                   -- "Verified buyer"
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (product_id, user_id)                                    -- one review per product
);

create index reviews_product_approved_idx
  on public.reviews (product_id, created_at desc) where status = 'approved';
create index reviews_status_idx on public.reviews (status, created_at desc);
create index reviews_user_id_idx on public.reviews (user_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Guard: customers can only write rating + body
-- ---------------------------------------------------------------------
-- Admins can change anything. For everyone else:
--   insert: the review is hers, pending, not verified, with her profile name
--   update: only rating / body change; a change sends it back to 'pending'
create or replace function public.reviews_guard()
returns trigger
language plpgsql
security definer          -- reads profiles for the name
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id      := auth.uid();
    new.status       := 'pending';
    new.is_verified  := false;
    new.display_name := (select left(nullif(btrim(p.full_name), ''), 120)
                         from public.profiles p where p.id = auth.uid());
    new.body         := btrim(new.body);
    return new;
  end if;

  -- UPDATE
  new.user_id      := old.user_id;
  new.product_id   := old.product_id;
  new.display_name := old.display_name;
  new.is_verified  := old.is_verified;
  new.created_at   := old.created_at;
  new.body         := btrim(new.body);
  if new.rating is distinct from old.rating or new.body is distinct from old.body then
    new.status := 'pending';
  else
    new.status := old.status;
  end if;
  return new;
end;
$$;

revoke all on function public.reviews_guard() from public, anon, authenticated;

create trigger reviews_guard
  before insert or update on public.reviews
  for each row execute function public.reviews_guard();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.reviews enable row level security;

-- Everyone: approved reviews of active products.
create policy "Public can read approved reviews"
  on public.reviews for select to anon, authenticated
  using (
    status = 'approved'
    and exists (select 1 from public.products p where p.id = reviews.product_id and p.is_active)
  );

-- A customer sees her own review whatever its status.
create policy "Customers read their reviews"
  on public.reviews for select to authenticated
  using (user_id = (select auth.uid()));

-- A customer reviews an active product, as herself.
create policy "Customers write reviews"
  on public.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.products p where p.id = reviews.product_id and p.is_active)
  );

create policy "Customers edit their reviews"
  on public.reviews for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Customers delete their reviews"
  on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins manage reviews"
  on public.reviews for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Column access. user_id is left out of SELECT, so visitors can't link reviews
-- to accounts (RLS can still use it). Customers send only product_id, rating, body;
-- the trigger fills the rest. status / is_verified are granted for admins, and
-- the trigger ignores them for customers.
revoke all on public.reviews from anon, authenticated;
grant select (id, product_id, display_name, rating, body, is_verified, status, created_at, updated_at)
  on public.reviews to anon, authenticated;
grant insert (product_id, rating, body) on public.reviews to authenticated;
grant update (rating, body, status, is_verified) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;


-- =====================================================================
-- Step 4: summary + list
-- =====================================================================

-- ---------- product_review_stats ----------
-- One row per active product, also with 0 reviews. Counts approved reviews only.
create view public.product_review_stats
with (security_invoker = true)
as
select
  p.id                                         as product_id,
  p.slug,
  count(r.id)::int                             as review_count,
  coalesce(round(avg(r.rating), 1), 0)::numeric(2, 1) as avg_rating,
  count(r.id) filter (where r.rating = 5)::int as count_5,
  count(r.id) filter (where r.rating = 4)::int as count_4,
  count(r.id) filter (where r.rating = 3)::int as count_3,
  count(r.id) filter (where r.rating = 2)::int as count_2,
  count(r.id) filter (where r.rating = 1)::int as count_1,
  count(r.id) filter (where r.is_verified)::int as verified_count
from public.products p
left join public.reviews r on r.product_id = p.id and r.status = 'approved'
group by p.id, p.slug;

grant select on public.product_review_stats to anon, authenticated;

-- ---------- list_reviews() ----------
-- Approved reviews of one product, sorted and paged.
--   sort       'newest' (default) | 'highest' | 'lowest'
--   page       1, 2, 3 ...
--   page_size  1 to 50 (the product page shows 3)
-- total_count = all approved reviews of the product (same on every row), for "See all".
create or replace function public.list_reviews(
  product_slug text,
  sort         text default 'newest',
  page         int  default 1,
  page_size    int  default 3
)
returns table (
  id            bigint,
  display_name  text,
  rating        smallint,
  body          text,
  is_verified   boolean,
  created_at    timestamptz,
  total_count   int
)
language sql
stable
security invoker
set search_path = ''
as $$
  select r.id, r.display_name, r.rating, r.body, r.is_verified, r.created_at,
         (count(*) over ())::int as total_count
  from public.reviews r
  join public.products p on p.id = r.product_id
  where p.slug = list_reviews.product_slug
    and r.status = 'approved'
  order by
    case when list_reviews.sort = 'highest' then r.rating end desc,
    case when list_reviews.sort = 'lowest'  then r.rating end asc,
    r.created_at desc,
    r.id desc
  limit  least(greatest(coalesce(list_reviews.page_size, 3), 1), 50)
  offset (greatest(coalesce(list_reviews.page, 1), 1) - 1)
         * least(greatest(coalesce(list_reviews.page_size, 3), 1), 50);
$$;

grant execute on function public.list_reviews(text, text, int, int) to anon, authenticated;

-- ---------- my_review() ----------
-- The signed-in customer's review of a product (any status), or no row.
-- Lets the page show "Your review is waiting for approval" or an Edit button.
create or replace function public.my_review(product_slug text)
returns table (
  id          bigint,
  rating      smallint,
  body        text,
  status      text,
  created_at  timestamptz,
  updated_at  timestamptz
)
language sql
stable
-- security definer: customers can't SELECT reviews.user_id (hidden column), so the
-- function filters on it for them. It only ever returns the caller's own row.
security definer
set search_path = ''
as $$
  select r.id, r.rating, r.body, r.status, r.created_at, r.updated_at
  from public.reviews r
  join public.products p on p.id = r.product_id
  where p.slug = my_review.product_slug
    and r.user_id = (select auth.uid());
$$;

revoke all on function public.my_review(text) from public, anon;
grant execute on function public.my_review(text) to authenticated;

commit;
