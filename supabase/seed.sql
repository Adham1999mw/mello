-- =====================================================================
-- Sample catalog for testing (safe to delete later)
-- =====================================================================
-- Run AFTER migrations/20261125000000_catalog.sql, in the SQL Editor.
-- Images are placeholders; replace them with your photos in Storage.

insert into public.categories (slug, name_ar, name_en, sort_order) values
  ('dresses', 'فساتين',  'Dresses', 1),
  ('tops',    'بلوزات',  'Tops',    2),
  ('abayas',  'عبايات',  'Abayas',  3),
  ('skirts',  'جيبات',   'Skirts',  4),
  ('sets',    'أطقم',    'Sets',    5)
on conflict (slug) do nothing;

insert into public.colors (slug, name_ar, name_en, hex, sort_order) values
  ('black',     'أسود',     'Black',     '#1A1A1A', 1),
  ('burgundy',  'نبيتي',    'Burgundy',  '#6E1F2E', 2),
  ('champagne', 'شامبين',   'Champagne', '#E8D5B5', 3),
  ('beige',     'بيج',      'Beige',     '#D8C3A5', 4),
  ('navy',      'كحلي',     'Navy',      '#1F2A44', 5),
  ('white',     'أبيض',     'White',     '#FAFAF7', 6),
  ('olive',     'زيتي',     'Olive',     '#5B5E3B', 7)
on conflict (slug) do nothing;

insert into public.sizes (code, name_ar, name_en, sort_order) values
  ('XS',   'XS',       'XS',        1),
  ('S',    'S',        'S',         2),
  ('M',    'M',        'M',         3),
  ('L',    'L',        'L',         4),
  ('XL',   'XL',       'XL',        5),
  ('XXL',  'XXL',      'XXL',       6),
  ('free', 'فري سايز', 'Free size', 7)
on conflict (code) do nothing;

insert into public.products (slug, category_id, name_ar, name_en, description_ar, description_en, is_featured) values
  ('layla-maxi-dress', (select id from public.categories where slug = 'dresses'),
   'فستان ليلى ماكسي', 'Layla maxi dress',
   'فستان طويل من الساتان بأكمام واسعة وحزام عند الوسط.', 'A long satin dress with wide sleeves and a waist tie.', true),
  ('nour-linen-shirt', (select id from public.categories where slug = 'tops'),
   'قميص نور كتان', 'Nour linen shirt',
   'قميص كتان واسع مناسب للصيف.', 'A relaxed linen shirt for summer.', false),
  ('salma-open-abaya', (select id from public.categories where slug = 'abayas'),
   'عباية سلمى مفتوحة', 'Salma open abaya',
   'عباية كريب مفتوحة بتطريز بسيط عند الأكمام.', 'An open crepe abaya with light embroidery on the sleeves.', true),
  ('hana-pleated-skirt', (select id from public.categories where slug = 'skirts'),
   'جيبة هنا بليسيه', 'Hana pleated skirt',
   'جيبة بليسيه ميدي بوسط مطاط.', 'A midi pleated skirt with an elastic waist.', false),
  ('mariam-knit-set', (select id from public.categories where slug = 'sets'),
   'طقم مريم تريكو', 'Mariam knit set',
   'طقم تريكو بلوزة وبنطلون واسع.', 'A knit set: top and wide-leg trousers.', false),
  ('farida-wrap-dress', (select id from public.categories where slug = 'dresses'),
   'فستان فريدة ملفوف', 'Farida wrap dress',
   'فستان ميدي ملفوف من الشيفون.', 'A chiffon midi wrap dress.', false)
on conflict (slug) do nothing;

-- Variants: every color x size of each product, with a price and some stock.
-- (Real products won't have every combination; just add the rows you sell.)
with spec(product_slug, color_slugs, size_codes, price, compare_at) as (values
  ('layla-maxi-dress',   array['black','burgundy','champagne'], array['S','M','L','XL'], 1850.00, 2200.00),
  ('nour-linen-shirt',   array['white','beige','olive'],        array['S','M','L'],       690.00,  null),
  ('salma-open-abaya',   array['black','navy'],                 array['free'],           1450.00,  null),
  ('hana-pleated-skirt', array['black','champagne','navy'],     array['S','M','L'],       750.00,  900.00),
  ('mariam-knit-set',    array['beige','burgundy'],             array['S','M','L','XL'], 1250.00,  null),
  ('farida-wrap-dress',  array['olive','navy','burgundy'],      array['XS','S','M','L'], 1590.00,  null)
)
insert into public.product_variants (product_id, color_id, size_id, sku, price, compare_at_price, stock)
select
  p.id, co.id, s.id,
  upper(p.slug || '-' || co.slug || '-' || s.code),
  spec.price + case s.code when 'XL' then 50 when 'XXL' then 100 else 0 end,
  spec.compare_at,
  -- deterministic "random" stock 0..9, so some variants are sold out
  (abs(hashtext(p.slug || co.slug || s.code)) % 10)
from spec
join public.products p on p.slug = spec.product_slug
join public.colors  co on co.slug = any (spec.color_slugs)
join public.sizes   s  on s.code  = any (spec.size_codes)
on conflict (product_id, color_id, size_id) do nothing;

-- Placeholder images: one per product color (first one is the cover).
insert into public.product_images (product_id, color_id, url, alt_ar, alt_en, sort_order)
select
  p.id, co.id,
  'https://placehold.co/800x1000/' || ltrim(co.hex, '#') || '/FFFFFF/png?text=' || replace(p.name_en, ' ', '+'),
  p.name_ar || ' - ' || co.name_ar,
  p.name_en || ' - ' || co.name_en,
  row_number() over (partition by p.id order by co.sort_order) - 1
from public.products p
join (select distinct product_id, color_id from public.product_variants) pv on pv.product_id = p.id
join public.colors co on co.id = pv.color_id
where not exists (select 1 from public.product_images i where i.product_id = p.id);

-- More placeholder photos: a "Back" and a "Detail" photo for every product color,
-- so the product card's photo slider has something to swipe through.
-- They come after the main photos (sort_order 100+), grouped by color.
-- Safe to run again: a photo is only added if that URL isn't there yet.
insert into public.product_images (product_id, color_id, url, alt_ar, alt_en, sort_order)
select
  p.id, co.id,
  'https://placehold.co/800x1000/' || ltrim(co.hex, '#') || '/' || shot.text_hex || '/png?text='
    || replace(p.name_en, ' ', '+') || '+-+' || shot.label_en,
  p.name_ar || ' - ' || co.name_ar || ' - ' || shot.label_ar,
  p.name_en || ' - ' || co.name_en || ' - ' || shot.label_en,
  100 + co.sort_order * 10 + shot.n
from public.products p
join (select distinct product_id, color_id from public.product_variants) pv on pv.product_id = p.id
join public.colors co on co.id = pv.color_id
cross join (values
  (1, 'Back',   'من الخلف', 'FFFFFF'),
  (2, 'Detail', 'تفاصيل',   'EED3B8')
) as shot (n, label_en, label_ar, text_hex)
where not exists (
  select 1 from public.product_images i
  where i.product_id = p.id
    and i.url = 'https://placehold.co/800x1000/' || ltrim(co.hex, '#') || '/' || shot.text_hex || '/png?text='
                || replace(p.name_en, ' ', '+') || '+-+' || shot.label_en
);
