-- =====================================================================
-- Lookbook: a special image per product
-- =====================================================================
-- Run this in Supabase (SQL Editor → New query → paste → Run) AFTER
-- 20261125010000_listing_variants.sql and 20261125020000_admin.sql.
-- Safe to run more than once.
--
-- The homepage lookbook (the swiper) shows every active product with
-- is_featured = true, through the same API as the product grid:
--   search_products(featured => true)
-- Each product can have one special image for it, e.g. a cutout of the
-- outfit on a transparent background. Products without one use their cover photo.
--
-- products gets:
--   feature_image_url     Storage path in "product-images" (or a full URL)
--   feature_image_alt_ar  text for screen readers, Arabic
--   feature_image_alt_en  ... English
--   feature_image_fit     'contain' = whole figure in view (cutouts), 'cover' = fill the frame (photos)
-- product_listing (so search_products) returns these 4 columns too, and
-- admin_save_product() saves them from the `product` JSON.

begin;

alter table public.products
  add column if not exists feature_image_url    text,
  add column if not exists feature_image_alt_ar text,
  add column if not exists feature_image_alt_en text,
  add column if not exists feature_image_fit    text not null default 'contain';

alter table public.products drop constraint if exists products_feature_image_fit_check;
alter table public.products
  add constraint products_feature_image_fit_check check (feature_image_fit in ('cover', 'contain'));

-- New columns go at the end, so the view can be replaced in place.
-- security_invoker = the view obeys the RLS policies (only active products, variants, images).
create or replace view public.product_listing
with (security_invoker = true)
as
select
  -- Same columns as before (unchanged) ...
  p.id,
  p.slug,
  p.name_ar,
  p.name_en,
  p.category_id,
  c.slug                                    as category_slug,
  p.is_featured,
  p.created_at,
  v.min_price,
  v.max_price,
  v.compare_at_price,
  coalesce(v.total_stock, 0)                as total_stock,
  coalesce(v.total_stock, 0) > 0            as in_stock,
  img.url                                   as cover_url,
  img.alt_ar                                as cover_alt_ar,
  img.alt_en                                as cover_alt_en,
  coalesce(v.color_slugs, '{}')             as color_slugs,
  coalesce(v.size_codes, '{}')              as size_codes,
  coalesce(v.colors, '[]'::jsonb)           as colors,
  -- ... plus the new ones.
  coalesce(vj.variants, '[]'::jsonb)        as variants,
  coalesce(im.images, '[]'::jsonb)          as images,
  coalesce(sz.sizes, '[]'::jsonb)           as sizes,
  dv.color_slug                             as default_color_slug,
  dv.id                                     as default_variant_id,
  -- NEW (20261126000000): the special lookbook image
  p.feature_image_url,
  p.feature_image_alt_ar,
  p.feature_image_alt_en,
  p.feature_image_fit
from public.products p
left join public.categories c on c.id = p.category_id

-- Price range, stock, color and size lists (as before)
left join lateral (
  select
    min(pv.price)                                     as min_price,
    max(pv.price)                                     as max_price,
    max(pv.compare_at_price)                          as compare_at_price,
    sum(pv.stock)::int                                as total_stock,
    array_agg(distinct co.slug)                       as color_slugs,
    (
      select array_agg(y.code order by y.sort_order)
      from (
        select distinct s2.code, s2.sort_order
        from public.product_variants pv3
        join public.sizes s2 on s2.id = pv3.size_id
        where pv3.product_id = p.id and pv3.is_active
      ) y
    )                                                 as size_codes,
    (
      select jsonb_agg(jsonb_build_object(
               'slug', x.slug, 'hex', x.hex, 'name_ar', x.name_ar, 'name_en', x.name_en)
             order by x.sort_order)
      from (
        select distinct co2.slug, co2.hex, co2.name_ar, co2.name_en, co2.sort_order
        from public.product_variants pv2
        join public.colors co2 on co2.id = pv2.color_id
        where pv2.product_id = p.id and pv2.is_active
      ) x
    )                                                 as colors
  from public.product_variants pv
  join public.colors co on co.id = pv.color_id
  join public.sizes  s  on s.id  = pv.size_id
  where pv.product_id = p.id and pv.is_active
) v on true

-- Cover photo: the first one (as before), plus its color for the default variant
left join lateral (
  select pi.url, pi.alt_ar, pi.alt_en, pi.color_id
  from public.product_images pi
  where pi.product_id = p.id
  order by pi.sort_order, pi.id
  limit 1
) img on true

-- NEW: every variant, ordered by color then size
left join lateral (
  select jsonb_agg(jsonb_build_object(
           'id', pv.id,
           'sku', pv.sku,
           'price', pv.price,
           'compare_at_price', pv.compare_at_price,
           'stock', pv.stock,
           'color_slug', co.slug,
           'size_code', s.code)
         order by co.sort_order, s.sort_order) as variants
  from public.product_variants pv
  join public.colors co on co.id = pv.color_id
  join public.sizes  s  on s.id  = pv.size_id
  where pv.product_id = p.id and pv.is_active
) vj on true

-- NEW: every photo, in display order, with the color it shows (null = all colors)
left join lateral (
  select jsonb_agg(jsonb_build_object(
           'url', pi.url,
           'alt_ar', pi.alt_ar,
           'alt_en', pi.alt_en,
           'color_slug', co.slug)
         order by pi.sort_order, pi.id) as images
  from public.product_images pi
  left join public.colors co on co.id = pi.color_id
  where pi.product_id = p.id
) im on true

-- NEW: the sizes this product comes in, with their names, S → XL
left join lateral (
  select jsonb_agg(jsonb_build_object(
           'code', z.code, 'name_ar', z.name_ar, 'name_en', z.name_en, 'sort_order', z.sort_order)
         order by z.sort_order) as sizes
  from (
    select distinct s.code, s.name_ar, s.name_en, s.sort_order
    from public.product_variants pv
    join public.sizes s on s.id = pv.size_id
    where pv.product_id = p.id and pv.is_active
  ) z
) sz on true

-- NEW: the default variant. Picks, in this order:
--   1. a color that has stock, 2. the cover photo's color, 3. a size in stock,
--   4. the first color, 5. the smallest size.
left join lateral (
  select pv.id, co.slug as color_slug
  from public.product_variants pv
  join public.colors co on co.id = pv.color_id
  join public.sizes  s  on s.id  = pv.size_id
  where pv.product_id = p.id and pv.is_active
  order by
    exists (
      select 1 from public.product_variants pv4
      where pv4.product_id = p.id and pv4.color_id = pv.color_id
        and pv4.is_active and pv4.stock > 0
    ) desc,
    (pv.color_id = img.color_id) desc nulls last,
    (pv.stock > 0) desc,
    co.sort_order,
    s.sort_order
  limit 1
) dv on true;

grant select on public.product_listing to anon, authenticated;

-- search_products(): unchanged, recreated so its rows include the new view columns.
create or replace function public.search_products(
  category_slug text    default null,  -- includes child categories
  colors        text[]  default null,  -- color slugs, any of
  sizes         text[]  default null,  -- size codes, any of
  min_price     numeric default null,
  max_price     numeric default null,
  in_stock      boolean default null,  -- true = only variants with stock > 0
  search        text    default null,  -- matches name_ar / name_en
  featured      boolean default null
)
returns setof public.product_listing
language sql
stable
security invoker
set search_path = ''
as $$
  select l.*
  from public.product_listing l
  where
    (search_products.category_slug is null or l.category_id in (
      select c.id from public.categories c
      where c.slug = search_products.category_slug
         or c.parent_id = (select c2.id from public.categories c2
                           where c2.slug = search_products.category_slug)
    ))
    and (search_products.featured is null or l.is_featured = search_products.featured)
    and (
      search_products.search is null or btrim(search_products.search) = ''
      or l.name_ar ilike '%' || btrim(search_products.search) || '%'
      or l.name_en ilike '%' || btrim(search_products.search) || '%'
    )
    and (
      (search_products.colors is null or cardinality(search_products.colors) = 0)
      and (search_products.sizes is null or cardinality(search_products.sizes) = 0)
      and search_products.min_price is null
      and search_products.max_price is null
      and search_products.in_stock is not true
      or exists (
        select 1
        from public.product_variants pv
        join public.colors co on co.id = pv.color_id
        join public.sizes  s  on s.id  = pv.size_id
        where pv.product_id = l.id
          and pv.is_active
          and (search_products.colors is null or cardinality(search_products.colors) = 0
               or co.slug = any (search_products.colors))
          and (search_products.sizes is null or cardinality(search_products.sizes) = 0
               or s.code = any (search_products.sizes))
          and (search_products.min_price is null or pv.price >= search_products.min_price)
          and (search_products.max_price is null or pv.price <= search_products.max_price)
          and (search_products.in_stock is not true or pv.stock > 0)
      )
    );
$$;

grant execute on function public.search_products(text, text[], text[], numeric, numeric, boolean, text, boolean)
  to anon, authenticated;


-- =====================================================================
-- admin_save_product(): now also saves the special image
-- =====================================================================
-- product   {..., "is_featured", "feature_image_url", "feature_image_alt_ar",
--            "feature_image_alt_en", "feature_image_fit"}
-- Everything else is unchanged (see 20261125020000_admin.sql).
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
                                 description_en, is_active, is_featured,
                                 feature_image_url, feature_image_alt_ar,
                                 feature_image_alt_en, feature_image_fit)
    values (
      product ->> 'slug',
      nullif(product ->> 'category_id', '')::bigint,
      product ->> 'name_ar',
      product ->> 'name_en',
      nullif(product ->> 'description_ar', ''),
      nullif(product ->> 'description_en', ''),
      coalesce((product ->> 'is_active')::boolean, true),
      coalesce((product ->> 'is_featured')::boolean, false),
      nullif(product ->> 'feature_image_url', ''),
      nullif(product ->> 'feature_image_alt_ar', ''),
      nullif(product ->> 'feature_image_alt_en', ''),
      coalesce(nullif(product ->> 'feature_image_fit', ''), 'contain')
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
      is_featured    = coalesce((product ->> 'is_featured')::boolean, false),
      feature_image_url    = nullif(product ->> 'feature_image_url', ''),
      feature_image_alt_ar = nullif(product ->> 'feature_image_alt_ar', ''),
      feature_image_alt_en = nullif(product ->> 'feature_image_alt_en', ''),
      feature_image_fit    = coalesce(nullif(product ->> 'feature_image_fit', ''), 'contain')
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

commit;
