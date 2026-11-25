-- =====================================================================
-- Product cards with variants, photos and a default variant
-- =====================================================================
-- Run this in Supabase (SQL Editor → New query → paste → Run) AFTER
-- 20261125000000_catalog.sql. It is safe to run once; it rebuilds the
-- product_listing view and the search_products() function that returns it.
--
-- Each product row now also has:
--   variants            every color x size: id, sku, price, compare_at_price, stock, color_slug, size_code
--   images              every photo: url, alt_ar, alt_en, color_slug (null = all colors)
--   sizes               the sizes it comes in, S → XL: code, name_ar, name_en
--   default_color_slug  the color to show first: the cover photo's color if it is in
--                       stock, otherwise the first color that is in stock
--   default_variant_id  the first in-stock size of that color
-- so a product card can switch color and show that color's photo, price and stock
-- without another request.

begin;

drop function if exists public.search_products(text, text[], text[], numeric, numeric, boolean, text, boolean);
drop view if exists public.product_listing;

-- security_invoker = the view obeys the RLS policies (only active products, variants, images).
create view public.product_listing
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
  dv.id                                     as default_variant_id
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

-- search_products(): unchanged, recreated because it returns product_listing rows.
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

commit;
