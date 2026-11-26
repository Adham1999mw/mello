-- =====================================================================
-- Sample product specifications for testing (safe to delete later)
-- =====================================================================
-- Run AFTER seed.sql and migrations/20261128000000_product_specs.sql.
-- Fills the "Fabric & care" fields of the sample products, so the product
-- page has something to show. Safe to run more than once.

update public.products p set
  fabric_ar         = s.fabric_ar,
  fabric_en         = s.fabric_en,
  fabric_weight_gsm = s.gsm,
  origin_ar         = 'القاهرة',
  origin_en         = 'Cairo',
  care_ar           = s.care_ar,
  care_en           = s.care_en,
  care_icons        = s.icons,
  model_height_cm   = 170,
  model_size_code   = 'S'
from (values
  ('mariam-knit-set',
   '٨٠٪ قطن و٢٠٪ بوليستر', '80% cotton, 20% polyester', 320,
   'غسيل في الغسالة على ٣٠ درجة على الوش التاني. ممنوع المجفف. كيّ على حرارة هادية بعيد عن التطريز.',
   'Machine wash at 30°, inside out. Do not tumble dry. Iron on low, away from the embroidery.',
   array['wash_30', 'no_tumble_dry', 'iron_low']),
  ('layla-maxi-dress',
   '١٠٠٪ ساتان بوليستر', '100% polyester satin', 140,
   'غسيل باليد في مياه باردة. ينشف مفرود. كيّ على حرارة هادية من الوش التاني.',
   'Hand wash cold. Dry flat. Iron on low, inside out.',
   array['hand_wash', 'dry_flat', 'iron_low']),
  ('nour-linen-shirt',
   '١٠٠٪ كتان', '100% linen', 180,
   'غسيل في الغسالة على ٣٠ درجة. ينشف على الحبل. كيّ على حرارة متوسطة وهو لسه رطب.',
   'Machine wash at 30°. Line dry. Iron on medium while still damp.',
   array['wash_30', 'line_dry', 'iron_medium']),
  ('salma-open-abaya',
   '١٠٠٪ كريب', '100% crepe', 160,
   'تنظيف جاف فقط.', 'Dry clean only.',
   array['no_wash', 'dry_clean', 'iron_low'])
) as s (slug, fabric_ar, fabric_en, gsm, care_ar, care_en, icons)
where p.slug = s.slug;
