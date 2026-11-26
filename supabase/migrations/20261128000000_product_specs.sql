-- =====================================================================
-- Product page: specifications + delivery settings
-- =====================================================================
-- Run this in Supabase (SQL Editor → New query → paste → Run) AFTER
-- 20261126000000_lookbook_feature_image.sql. Safe to run more than once.
--
-- 1. products gets the "Fabric & care" details shown on the product page
--    (the description already exists: description_ar / description_en):
--      fabric_ar / fabric_en        "80% cotton, 20% polyester"
--      fabric_weight_gsm            320  (g/m²)
--      origin_ar / origin_en        "Cairo"
--      care_ar / care_en            washing and ironing instructions
--      care_icons                   care symbols, e.g. {wash_30, no_tumble_dry, iron_low}
--      model_height_cm / model_size_code   "The model is 170 cm and wears S"
--      delivery_note_ar / _en       optional, only for products with special delivery
--
-- 2. store_settings: ONE row with the delivery & returns info that every
--    product page shares (the "Delivery & returns" tab and the service strip).
--
-- 3. admin_save_product() also saves the new product fields. A field is only
--    changed when its key is in the `product` JSON, so an older admin screen
--    that doesn't send it never wipes it.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Product specifications
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists fabric_ar         text,
  add column if not exists fabric_en         text,
  add column if not exists fabric_weight_gsm int,
  add column if not exists origin_ar         text,
  add column if not exists origin_en         text,
  add column if not exists care_ar           text,
  add column if not exists care_en           text,
  add column if not exists care_icons        text[] not null default '{}',
  add column if not exists model_height_cm   int,
  add column if not exists model_size_code   text,
  add column if not exists delivery_note_ar  text,
  add column if not exists delivery_note_en  text;

alter table public.products drop constraint if exists products_fabric_weight_gsm_check;
alter table public.products
  add constraint products_fabric_weight_gsm_check
  check (fabric_weight_gsm is null or fabric_weight_gsm between 1 and 2000);

alter table public.products drop constraint if exists products_model_height_cm_check;
alter table public.products
  add constraint products_model_height_cm_check
  check (model_height_cm is null or model_height_cm between 120 and 220);

-- Only symbols the storefront has an icon for.
alter table public.products drop constraint if exists products_care_icons_check;
alter table public.products
  add constraint products_care_icons_check
  check (care_icons <@ array[
    'wash_30', 'wash_40', 'hand_wash', 'no_wash',
    'no_bleach', 'no_tumble_dry', 'tumble_dry_low', 'dry_flat', 'line_dry',
    'iron_low', 'iron_medium', 'no_iron', 'dry_clean', 'no_dry_clean'
  ]::text[]);

-- model_size_code must be a real size (no foreign key on a text column, so a trigger).
create or replace function public.check_model_size_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.model_size_code is not null
     and not exists (select 1 from public.sizes s where s.code = new.model_size_code) then
    raise exception 'Unknown size code: %', new.model_size_code using errcode = '23503';
  end if;
  return new;
end;
$$;

drop trigger if exists products_check_model_size_code on public.products;
create trigger products_check_model_size_code
  before insert or update of model_size_code on public.products
  for each row execute function public.check_model_size_code();

-- RLS: nothing new. "Public can read active products" and "Admins manage products"
-- already cover every column of products.


-- ---------------------------------------------------------------------
-- 2. Store settings (delivery & returns), a single row
-- ---------------------------------------------------------------------
create table if not exists public.store_settings (
  -- Always true: the primary key + check allow exactly one row.
  id                       boolean primary key default true check (id),

  -- "Delivery & returns" tab on every product page
  delivery_ar              text not null default '',
  delivery_en              text not null default '',

  -- Service strip under "Add to bag" + free delivery progress in the bag
  free_shipping_threshold  numeric(10, 2) check (free_shipping_threshold is null or free_shipping_threshold >= 0),
  cairo_days_min           int not null default 2,
  cairo_days_max           int not null default 3,
  other_days_min           int not null default 3,
  other_days_max           int not null default 5,
  exchange_days            int not null default 14 check (exchange_days >= 0),
  cod_enabled              boolean not null default true,   -- cash on delivery

  updated_at               timestamptz not null default now(),

  check (cairo_days_min between 0 and 60 and cairo_days_min <= cairo_days_max),
  check (other_days_min between 0 and 60 and other_days_min <= other_days_max)
);

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- The one row, with the texts from the product page design.
insert into public.store_settings (delivery_ar, delivery_en, free_shipping_threshold)
values (
  'القاهرة والجيزة خلال ٢ إلى ٣ أيام عمل، وباقي المحافظات خلال ٣ إلى ٥ أيام. ادفعي بالكارت أو كاش عند الاستلام. تقدري تبدّلي المقاس مجاناً خلال ١٤ يوم.',
  'Cairo and Giza in 2 to 3 working days, other governorates in 3 to 5. Pay by card or cash on delivery. Exchange the size for free within 14 days.',
  3000
)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings"
  on public.store_settings for select to anon, authenticated
  using (true);

-- Admins can only edit the existing row (no insert / delete, so it always exists).
drop policy if exists "Admins update store settings" on public.store_settings;
create policy "Admins update store settings"
  on public.store_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;


-- ---------------------------------------------------------------------
-- 3. admin_save_product(): also saves the specification fields
-- ---------------------------------------------------------------------
-- product   {..., "fabric_ar", "fabric_en", "fabric_weight_gsm", "origin_ar", "origin_en",
--            "care_ar", "care_en", "care_icons": ["wash_30", ...], "model_height_cm",
--            "model_size_code", "delivery_note_ar", "delivery_note_en"}
-- New fields are optional: a missing key keeps the saved value; "" or null clears it.
-- Everything else is unchanged (see 20261126000000_lookbook_feature_image.sql).
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

  -- Specification fields: only the keys that were sent.
  update public.products p set
    fabric_ar         = case when product ? 'fabric_ar'         then nullif(product ->> 'fabric_ar', '')                else p.fabric_ar end,
    fabric_en         = case when product ? 'fabric_en'         then nullif(product ->> 'fabric_en', '')                else p.fabric_en end,
    fabric_weight_gsm = case when product ? 'fabric_weight_gsm' then nullif(product ->> 'fabric_weight_gsm', '')::int  else p.fabric_weight_gsm end,
    origin_ar         = case when product ? 'origin_ar'         then nullif(product ->> 'origin_ar', '')                else p.origin_ar end,
    origin_en         = case when product ? 'origin_en'         then nullif(product ->> 'origin_en', '')                else p.origin_en end,
    care_ar           = case when product ? 'care_ar'           then nullif(product ->> 'care_ar', '')                  else p.care_ar end,
    care_en           = case when product ? 'care_en'           then nullif(product ->> 'care_en', '')                  else p.care_en end,
    care_icons        = case when product ? 'care_icons' then
                          coalesce(
                            (select array_agg(x) from jsonb_array_elements_text(
                               case jsonb_typeof(product -> 'care_icons') when 'array' then product -> 'care_icons' else '[]'::jsonb end
                             ) x),
                            '{}')
                        else p.care_icons end,
    model_height_cm   = case when product ? 'model_height_cm'   then nullif(product ->> 'model_height_cm', '')::int    else p.model_height_cm end,
    model_size_code   = case when product ? 'model_size_code'   then nullif(product ->> 'model_size_code', '')          else p.model_size_code end,
    delivery_note_ar  = case when product ? 'delivery_note_ar'  then nullif(product ->> 'delivery_note_ar', '')         else p.delivery_note_ar end,
    delivery_note_en  = case when product ? 'delivery_note_en'  then nullif(product ->> 'delivery_note_en', '')         else p.delivery_note_en end
  where p.id = pid;

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
