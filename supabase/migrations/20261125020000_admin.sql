-- =====================================================================
-- Admin dashboard: who can write, and how
-- =====================================================================
-- Run AFTER 20261125000000_catalog.sql, in Dashboard -> SQL Editor.
--
-- How it works
--   1. You log in on /admin/ with email + password (Supabase Auth).
--   2. Your user id is in public.admins, so public.is_admin() is true for you.
--   3. Write policies below only allow insert / update / delete when is_admin().
--   Anyone else (logged in or not) can still only READ active products.
--
-- The service_role key is never used in the website.
-- =====================================================================

create table public.admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.admins enable row level security;

-- An admin can see the admins list (so the dashboard can check "am I admin?").
-- Nobody can add admins through the API: add them in the SQL Editor (see docs).
create policy "Admins can read admins"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.admins to authenticated;

-- security definer: reads public.admins without being blocked by its own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- write access for admins ----------
-- "for all" = select + insert + update + delete. Admins also see hidden
-- (is_active = false) rows, so they can edit and re-enable them.
do $$
declare
  t text;
begin
  foreach t in array array['categories', 'colors', 'sizes', 'products', 'product_images', 'product_variants']
  loop
    execute format(
      'create policy "Admins manage %1$s" on public.%1$I for all to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()))',
      t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;

-- ---------- photos in Storage ----------
-- The bucket is public for reading (product pages). Only admins can upload,
-- replace or delete files.
create policy "Admins upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admins update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admins delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- Listing files (needed to replace / delete them) is also admin-only.
create policy "Admins list product images"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- =====================================================================
-- admin_save_product(): save a product with all its variants and images
-- =====================================================================
-- One call, one transaction: if anything fails (duplicate SKU, bad price...)
-- nothing is saved, so a product is never left half-edited.
--
-- product   {"id": 12 | null, "slug", "category_id", "name_ar", "name_en",
--            "description_ar", "description_en", "is_active", "is_featured"}
-- variants  [{"color_id", "size_id", "sku", "price", "compare_at_price",
--             "stock", "is_active"}, ...]   -- the full list; missing ones are deleted
-- images    [{"id": 5 | null, "url", "color_id", "alt_ar", "alt_en"}, ...]
--            -- the full list in display order; missing ones are deleted
--
-- Returns the product id. Runs with the caller's rights, so RLS still applies.
create or replace function public.admin_save_product(
  product  jsonb,
  variants jsonb default '[]'::jsonb,
  images   jsonb default '[]'::jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  pid bigint := nullif(product ->> 'id', '')::bigint;
begin
  if not public.is_admin() then
    raise exception 'Only admins can save products' using errcode = '42501';
  end if;

  if pid is null then
    insert into public.products (slug, category_id, name_ar, name_en, description_ar,
                                 description_en, is_active, is_featured)
    values (
      product ->> 'slug',
      nullif(product ->> 'category_id', '')::bigint,
      product ->> 'name_ar',
      product ->> 'name_en',
      nullif(product ->> 'description_ar', ''),
      nullif(product ->> 'description_en', ''),
      coalesce((product ->> 'is_active')::boolean, true),
      coalesce((product ->> 'is_featured')::boolean, false)
    )
    returning id into pid;
  else
    update public.products set
      slug           = product ->> 'slug',
      category_id    = nullif(product ->> 'category_id', '')::bigint,
      name_ar        = product ->> 'name_ar',
      name_en        = product ->> 'name_en',
      description_ar = nullif(product ->> 'description_ar', ''),
      description_en = nullif(product ->> 'description_en', ''),
      is_active      = coalesce((product ->> 'is_active')::boolean, true),
      is_featured    = coalesce((product ->> 'is_featured')::boolean, false)
    where id = pid;
    if not found then
      raise exception 'Product % not found', pid using errcode = 'P0002';
    end if;
  end if;

  -- Variants are matched by color + size (one row per combination).
  delete from public.product_variants pv
  where pv.product_id = pid
    and not exists (
      select 1 from jsonb_array_elements(variants) v
      where (v ->> 'color_id')::bigint = pv.color_id
        and (v ->> 'size_id')::bigint = pv.size_id
    );

  -- Free the SKUs first, so two variants can swap SKUs in one save.
  update public.product_variants set sku = 'tmp-' || id || '-' || sku where product_id = pid;

  insert into public.product_variants (product_id, color_id, size_id, sku, price,
                                       compare_at_price, stock, is_active)
  select
    pid,
    (v ->> 'color_id')::bigint,
    (v ->> 'size_id')::bigint,
    v ->> 'sku',
    (v ->> 'price')::numeric,
    nullif(v ->> 'compare_at_price', '')::numeric,
    coalesce((v ->> 'stock')::int, 0),
    coalesce((v ->> 'is_active')::boolean, true)
  from jsonb_array_elements(variants) v
  on conflict (product_id, color_id, size_id) do update set
    sku              = excluded.sku,
    price            = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock            = excluded.stock,
    is_active        = excluded.is_active;

  -- Images: keep the ones still listed, in the new order; add new ones.
  delete from public.product_images pi
  where pi.product_id = pid
    and pi.id not in (
      select (i ->> 'id')::bigint from jsonb_array_elements(images) i
      where nullif(i ->> 'id', '') is not null
    );

  update public.product_images pi set
    url        = i.value ->> 'url',
    color_id   = nullif(i.value ->> 'color_id', '')::bigint,
    alt_ar     = nullif(i.value ->> 'alt_ar', ''),
    alt_en     = nullif(i.value ->> 'alt_en', ''),
    sort_order = (i.ordinality - 1)::int
  from jsonb_array_elements(images) with ordinality i
  where pi.product_id = pid
    and pi.id = nullif(i.value ->> 'id', '')::bigint;

  insert into public.product_images (product_id, url, color_id, alt_ar, alt_en, sort_order)
  select
    pid,
    i.value ->> 'url',
    nullif(i.value ->> 'color_id', '')::bigint,
    nullif(i.value ->> 'alt_ar', ''),
    nullif(i.value ->> 'alt_en', ''),
    (i.ordinality - 1)::int
  from jsonb_array_elements(images) with ordinality i
  where nullif(i.value ->> 'id', '') is null;

  return pid;
end;
$$;

revoke all on function public.admin_save_product(jsonb, jsonb, jsonb) from public;
grant execute on function public.admin_save_product(jsonb, jsonb, jsonb) to authenticated;
