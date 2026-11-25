-- =====================================================================
-- Needle catalog: categories, colors, sizes, products, images, variants
-- =====================================================================
-- Run this once in Supabase Dashboard -> SQL Editor (or `supabase db push`).
--
-- Model
--   categories        dresses, tops, abayas, ...
--   colors / sizes    shared lists, so filters work across all products
--   products          one row per design (bilingual name/description)
--   product_images    gallery; color_id set = photo of that color only
--   product_variants  one row per color x size: SKU, price, stock
--
-- Prices are EGP with 2 decimals. A product's price is its variants' price
-- (min_price .. max_price in the listing view).
--
-- Security: Row Level Security is ON for every table. The public (anon key)
-- can only READ active rows. Nobody can write through the anon key; you add
-- and edit products from the dashboard (Table Editor) or with the service key.
-- =====================================================================

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- categories ----------
create table public.categories (
  id          bigint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ar     text not null,
  name_en     text not null,
  parent_id   bigint references public.categories (id) on delete set null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- colors ----------
create table public.colors (
  id          bigint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ar     text not null,
  name_en     text not null,
  hex         text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order  int not null default 0
);

-- ---------- sizes ----------
create table public.sizes (
  id          bigint generated always as identity primary key,
  code        text not null unique,          -- 'S', 'M', 'L', 'XL', 'free'
  name_ar     text not null,
  name_en     text not null,
  sort_order  int not null default 0         -- S < M < L in filters and pickers
);

-- ---------- products ----------
create table public.products (
  id              bigint generated always as identity primary key,
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id     bigint references public.categories (id) on delete set null,
  name_ar         text not null,
  name_en         text not null,
  description_ar  text,
  description_en  text,
  is_active       boolean not null default true,   -- false = hidden from the store
  is_featured     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);
create index products_created_at_idx on public.products (created_at desc);
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- product_images ----------
create table public.product_images (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products (id) on delete cascade,
  color_id    bigint references public.colors (id) on delete set null,
  -- Full URL, or a path inside the "product-images" Storage bucket.
  url         text not null,
  alt_ar      text,
  alt_en      text,
  sort_order  int not null default 0              -- 0 = cover image
);
create index product_images_product_id_idx on public.product_images (product_id, sort_order);

-- ---------- product_variants (color x size) ----------
create table public.product_variants (
  id                bigint generated always as identity primary key,
  product_id        bigint not null references public.products (id) on delete cascade,
  color_id          bigint not null references public.colors (id),
  size_id           bigint not null references public.sizes (id),
  sku               text not null unique,
  price             numeric(10, 2) not null check (price >= 0),
  compare_at_price  numeric(10, 2) check (compare_at_price is null or compare_at_price > price), -- old price for "sale"
  stock             int not null default 0 check (stock >= 0),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (product_id, color_id, size_id)
);
create index product_variants_color_id_idx on public.product_variants (color_id);
create index product_variants_size_id_idx on public.product_variants (size_id);
create index product_variants_price_idx on public.product_variants (price);
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security: public read-only
-- =====================================================================
alter table public.categories       enable row level security;
alter table public.colors           enable row level security;
alter table public.sizes            enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;

create policy "Public can read active categories"
  on public.categories for select to anon, authenticated
  using (is_active);

create policy "Public can read colors"
  on public.colors for select to anon, authenticated
  using (true);

create policy "Public can read sizes"
  on public.sizes for select to anon, authenticated
  using (true);

create policy "Public can read active products"
  on public.products for select to anon, authenticated
  using (is_active);

create policy "Public can read images of active products"
  on public.product_images for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_active
  ));

create policy "Public can read active variants of active products"
  on public.product_variants for select to anon, authenticated
  using (is_active and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id and p.is_active
  ));

-- Read-only access for the browser. No insert/update/delete grants or
-- policies, so the anon key can never change the catalog.
grant usage on schema public to anon, authenticated;
grant select on
  public.categories, public.colors, public.sizes,
  public.products, public.product_images, public.product_variants
  to anon, authenticated;

-- =====================================================================
-- product_listing: one row per product, ready for product cards
-- =====================================================================
-- security_invoker = the view obeys the RLS policies above.
create view public.product_listing
with (security_invoker = true)
as
select
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
  coalesce(v.colors, '[]'::jsonb)           as colors
from public.products p
left join public.categories c on c.id = p.category_id
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
left join lateral (
  select pi.url, pi.alt_ar, pi.alt_en
  from public.product_images pi
  where pi.product_id = p.id
  order by pi.sort_order, pi.id
  limit 1
) img on true;

grant select on public.product_listing to anon, authenticated;

-- =====================================================================
-- search_products(): the filters
-- =====================================================================
-- Returns product_listing rows. Pagination, sorting and the total count are
-- added by the client: .order(...).range(from, to) with { count: "exact" }.
--
-- Color / size / price / in-stock are checked on the SAME variant, so
-- "black + M + in stock" only matches products that really have a black M
-- in stock (not "black in S" plus "M in white").
-- Every parameter is optional: null = no filter.
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
-- Storage bucket for product photos (public read)
-- =====================================================================
-- Upload photos in Dashboard -> Storage -> product-images, then put the file
-- path (e.g. "dresses/layla-black-1.webp") in product_images.url.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
