# Supabase: المنتجات والفلاتر خطوة بخطوة

الملف ده بيشرح إزاي تجهز قاعدة بيانات المنتجات على Supabase أول مرة، وإزاي الكود بيستخدمها.
(English summary at the bottom.)

---

## الفكرة ببساطة

- **Supabase** = قاعدة بيانات Postgres جاهزة على النت، ومعاها API أوتوماتيك لكل جدول.
- الموقع على Vercel. المتصفح بيكلم Supabase عن طريق `/supabase/...` على نفس الدومين، وصفحات زي صفحة المنتج بتجيب بياناتها على السيرفر.
- عشان ده يبقى آمن بنشغل **Row Level Security (RLS)**: قواعد جوه قاعدة البيانات بتقول
  "أي حد يقدر **يقرا** المنتجات المعروضة بس، ومحدش يقدر يضيف أو يعدل أو يمسح".
- يعني الـ "API" بتاعنا هو Supabase نفسه + شوية SQL، ومفيش سيرفر نكتبه.

## شكل البيانات

```
categories  (فساتين، بلوزات، عبايات...)
   │
products  (المنتج نفسه: الاسم عربي/إنجليزي، الوصف، القسم)
   ├── product_images    (الصور، وممكن صورة تتربط بلون معين)
   └── product_variants  (كل لون × مقاس = صف لوحده: SKU، السعر، المخزون)
            ├── colors   (أسود، نبيتي، شامبين... + كود اللون)
            └── sizes    (XS, S, M, L, XL, فري سايز + ترتيبهم)
```

مثال: "فستان ليلى" بييجي بـ 3 ألوان و 4 مقاسات = 12 variant. كل واحد ليه سعر ومخزون لوحده،
فممكن الأسود M يكون خلصان والنبيتي M موجود.

الألوان والمقاسات جداول مشتركة لكل المنتجات، عشان فلتر "أسود" يجيب كل المنتجات اللي فيها أسود.

## الخطوات اللي **إنت** محتاج تعملها (مرة واحدة)

### 1. اعمل مشروع Supabase

1. ادخل [supabase.com](https://supabase.com) واعمل حساب (ينفع بـ GitHub).
2. **New project** → اختار اسم (مثلا `needle`) → اكتب **Database password** قوي واحفظه عندك.
3. **Region**: اختار أقرب حاجة لمصر، زي `Central EU (Frankfurt)`.
4. استنى دقيقتين لحد ما المشروع يجهز.

### 2. شغل الـ SQL (الجداول + الصلاحيات)

1. من القايمة الشمال: **SQL Editor** → **New query**.
2. افتح الملف [`supabase/migrations/20261125000000_catalog.sql`](../supabase/migrations/20261125000000_catalog.sql)،
   انسخ كل اللي فيه، والصقه، ودوس **Run**.
   ده بيعمل الجداول، والـ RLS، والـ view بتاع كروت المنتجات، والفانكشن بتاعة الفلاتر، و bucket للصور.
3. **New query** تاني، والصق [`supabase/migrations/20261125010000_listing_variants.sql`](../supabase/migrations/20261125010000_listing_variants.sql)
   ودوس **Run**. ده بيخلي كل منتج في اللستة يرجع معاه كل الـ variants (لون × مقاس بالسعر والمخزون)، وكل الصور
   بلونها، والمقاسات، واللون/الـ variant الافتراضي. فكارت المنتج يقدر يغير اللون ويعرض صورته وسعره ومخزونه.
   (لو كنت شغلت الملف الأول قبل كده، شغل ده بس. ينفع يتشغل أكتر من مرة عادي.)
4. (اختياري بس مفيد للتجربة) **New query** تاني، والصق [`supabase/seed.sql`](../supabase/seed.sql) ودوس **Run**.
   ده بيضيف 6 منتجات تجريبية بألوان ومقاسات ومخزون وصور مؤقتة.
5. اتأكد: **Table Editor** → هتلاقي `products` و `product_variants` وباقي الجداول وفيها بيانات.

> لو شغلت الـ migration مرتين هيقولك إن الجداول موجودة. ده طبيعي، متشغلوش تاني.

### 3. هات الـ URL والمفتاح

**Project Settings** (الترس) → **API Keys** (أو **Data API**):

- **Project URL**: شكله `https://abcdxyz.supabase.co`
- **المفتاح العام**: اسمه `anon` `public`، أو في المشاريع الجديدة **Publishable key** (بيبدأ بـ `sb_publishable_`).
  أي واحد فيهم ينفع.

> ⚠️ **متنسخش** `service_role` أو **Secret key** في أي حتة في الموقع. ده مفتاح الأدمن وبيعدي من الـ RLS.

### 4. حطهم في الكود عندك (local)

```bash
cp .env.example .env.local
```

وافتح `.env.local` واكتب:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdxyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=المفتاح_العام_هنا
```

`.env.local` مش بيترفع على GitHub (موجود في `.gitignore`).

### 5. حطهم في Vercel

مشروعك على Vercel → **Settings** → **Environment Variables**:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | الـ Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام |

المفتاح العام أصلاً بيبان في المتصفح (وده عادي، الـ RLS هي اللي بتحمي البيانات).
بعد ما تضيفهم أو تغيرهم: **Deployments** → آخر deploy → **Redeploy**، لأن القيم دي بتتكتب جوه ملفات الـ JS وقت الـ build.

> طلبات المتصفح بتعدي من `/supabase/...` على نفس الدومين (هتلاقيها في Network باسم
> `/supabase/rest/v1/rpc/search_products`)، و Next بيوصّلها لـ Supabase.

### 6. إضافة منتجات حقيقية

- **Table Editor** → `products` → **Insert row**: الـ `slug` (إنجليزي صغير بشرطة، مثلا `amira-dress`)،
  الاسم عربي وإنجليزي، والقسم.
- بعدين `product_variants`: صف لكل لون × مقاس بتبيعه، بالـ SKU والسعر والمخزون.
- الصور: **Storage** → `product-images` → ارفع الصورة → وفي `product_images` اكتب مسار الملف
  (مثلا `dresses/amira-black-1.webp`) أو لينك كامل. `sort_order = 0` يبقى صورة الكارت.
- عايز تخفي منتج من غير ما تمسحه؟ خلي `is_active = false`.


## لوحة التحكم (Admin)

صفحة ليك إنت بس تضيف وتعدل وتمسح منها المنتجات بكل بياناتها: الأسماء، القسم، الألوان والمقاسات،
السعر والمخزون لكل لون × مقاس، والصور. ومنها كمان الأقسام والألوان والمقاسات نفسها.

- اللينك: `/ar/admin/` (أو `/en/admin/`)
- **المنتجات**: لستة بكل المنتجات (حتى المخفية) وبحث. دوس على منتج تعدله، أو «إضافة منتج».
- **صفحة المنتج**: البيانات الأساسية، بعدين اختار الألوان والمقاسات فتطلعلك كل التركيبات تكتب سعر
  ومخزون كل واحدة (وفيه «املا كل الاختيارات» تحط سعر واحد للكل)، وبعدين ارفع الصور ورتبها.
  «حفظ المنتج» بيحفظ كل ده مرة واحدة؛ لو فيه غلطة (زي SKU متكرر) مفيش حاجة بتتحفظ نص نص.
- **صفحة المنتج** فيها كمان قسم «الخامة والعناية والمقاس»: الخامة، وزن القماش، المنشأ، العناية ورموزها،
  طول العارضة ومقاسها، وملاحظة توصيل خاصة بالمنتج.
- **التقييمات** (`/ar/admin/reviews/`): التقييمات المستنية والمتوافق عليها والمرفوضة. موافقة، رفض،
  «مشترية مؤكدة»، أو مسح.
- **التوصيل** (`/ar/admin/delivery/`): نص التوصيل والاستبدال، أيام التوصيل، أيام الاستبدال المجاني،
  حد التوصيل المجاني، والدفع عند الاستلام. ده مشترك لكل المنتجات.
- **الإعدادات**: الأقسام والألوان (بكود اللون) والمقاسات (والترتيب S → XL).

### ليه هي آمنة

- الدخول بإيميل وكلمة سر (Supabase Auth).
- قاعدة البيانات نفسها بتسمح بالإضافة والتعديل والمسح **بس** للحسابات اللي في جدول `admins`.
  حتى لو حد فتح الصفحة أو عمل حساب، مش هيقدر يغير حاجة.
- مفتاح الـ `service_role` مش مستخدم في الموقع خالص.

### الخطوات اللي إنت محتاج تعملها (مرة واحدة)

1. **شغل SQL الأدمن**: SQL Editor → New query → الصق
   [`supabase/migrations/20261125020000_admin.sql`](../supabase/migrations/20261125020000_admin.sql) → **Run**
   (بعد ملف الـ catalog).
   وبعده **New query** تاني والصق
   [`supabase/migrations/20261126000000_lookbook_feature_image.sql`](../supabase/migrations/20261126000000_lookbook_feature_image.sql)
   → **Run** (صورة اللوك بوك الخاصة بكل منتج).
   وبعده **New query** والصق
   [`supabase/migrations/20261128000000_product_specs.sql`](../supabase/migrations/20261128000000_product_specs.sql)
   → **Run** (مواصفات المنتج: الخامة والعناية والمنشأ ومقاس العارضة، وجدول `store_settings` لنص
   التوصيل والاستبدال ومدة التوصيل والاستبدال المجاني). ولو عايز بيانات تجربة، شغّل بعده
   [`supabase/seed_product_specs.sql`](../supabase/seed_product_specs.sql).
   وبعده **New query** والصق
   [`supabase/migrations/20261129000000_reviews.sql`](../supabase/migrations/20261129000000_reviews.sql)
   → **Run** (تقييمات المنتجات: نجوم + تعليق العميلة). التقييم بيتحفظ `pending` ومش بيظهر غير لما
   الأدمن يغيّر `status` لـ `approved` من **Table Editor → reviews** (لحد ما نعمل صفحة الأدمن).
   «مشترية مؤكدة» = `is_verified`، بيعلّمها الأدمن بإيده دلوقتي.
2. **اعمل حسابك**: **Authentication** → **Users** → **Add user** → **Create new user** → اكتب إيميلك
   وكلمة سر قوية، وعلّم على **Auto Confirm User**.
3. **خلّي حسابك أدمن**: SQL Editor → New query → الصق ده بإيميلك ودوس **Run**:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'your@email.com';
   ```

4. **التسجيل لأي حد تاني**: كان هنا إنك تقفل **Allow new users to sign up**. دلوقتي الموقع فيه حسابات
   للعملاء، فلازم يفضل **مفتوح** (شوف [docs/customer-accounts.md](customer-accounts.md)). ده آمن: أي حد يعمل
   حساب بيبقى عميل عادي، والأدمن بس اللي في جدول `admins`، ومحدش يقدر يضيف نفسه فيه من الموقع.
5. افتح `/ar/admin/` وادخل بالإيميل وكلمة السر.

> نسيت كلمة السر؟ من **Authentication → Users** دوس على حسابك وغيرها، أو امسحه واعمله تاني وكرر خطوة 3.

ملاحظة: لو شلت صورة وحفظت، الملف بيتمسح من Storage. لو رفعت صورة وقفلت الصفحة من غير حفظ، الملف بيفضل في
Storage (مش بيظهر في أي حتة، ممكن تمسحه من **Storage → product-images** لو حبيت).

## الكود بيستخدمها إزاي

كل ده في `src/lib/catalog/`:

```ts
import { listProducts, getProductBySlug, getFilterOptions, findVariant } from "@/lib/catalog";

// لستة منتجات بفلاتر + صفحات
const page = await listProducts({
  category: "dresses",          // القسم (وبيشمل الأقسام اللي تحته)
  colors: ["black", "burgundy"], // أي لون من دول
  sizes: ["M", "L"],             // أي مقاس من دول
  minPrice: 500, maxPrice: 2000, // بالجنيه
  inStock: true,                 // اللون/المقاس المختار متاح فعلا
  search: "فستان",               // بحث في الاسم عربي وإنجليزي
  sort: "price_asc",             // newest | price_asc | price_desc | name
  page: 2, pageSize: 12,
});
page.items;     // كروت المنتجات
page.total;     // عدد كل النتايج
page.pageCount; // عدد الصفحات

// صفحة منتج: الصور + كل الألوان والمقاسات
const product = await getProductBySlug("layla-maxi-dress");
product?.colors;  // للـ color picker
product?.sizes;   // للـ size picker (مترتبين S → XL)
findVariant(product!, "black", "M"); // السعر والمخزون للاختيار ده

// القيم اللي بتتعرض في الفلاتر
const { categories, colors, sizes } = await getFilterOptions();
```

في الكومبوننتس استخدم الـ hooks (فيها caching):

```tsx
import { useListProductsQuery } from "@/store/services/products";
const { data, isLoading } = useListProductsQuery({ category: "dresses", page: 1 });
```

والفلاتر ممكن تتحفظ في الـ URL (`/products/?color=black&size=M&page=2`) بـ `filtersFromQuery` و `filtersToQuery`.

### ليه الفلاتر شغالة صح

لما تختار "أسود + M + متاح"، الفانكشن `search_products` بتدور على **variant واحد** يكون أسود و M ومخزونه
أكبر من صفر. فمش هيجيبلك منتج عنده أسود S بس و M أبيض.

### الـ types

`src/lib/supabase/database.types.ts` مكتوب بإيدينا بنفس شكل Supabase. لو غيرت في الجداول بعدين،
تقدر تولده أوتوماتيك:

```bash
npx supabase login
npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
```

---

## English summary

1. Create a Supabase project.
2. SQL Editor: run `supabase/migrations/20261125000000_catalog.sql`, then
   `supabase/migrations/20261125010000_listing_variants.sql` (variants, photos and a default variant on every
   product card), then optionally `supabase/seed.sql`.
3. Copy the Project URL and the anon / publishable key (never the service_role / secret key).
4. Put them in `.env.local` and in GitHub → Settings → Secrets and variables → Actions → **Variables**.
5. Admin dashboard at `/ar/admin/`: run `20261125020000_admin.sql`, create your user in Authentication →
   Users (auto confirm) and add it to `public.admins`. Keep public sign-ups on for customer
   accounts (docs/customer-accounts.md); only `public.admins` rows get admin access. Writes are allowed by RLS
   only for users in `public.admins`; products are saved atomically by `admin_save_product()`.
   Then run `20261126000000_lookbook_feature_image.sql`: a special lookbook image per product
   (`feature_image_*` on `products`, returned by `product_listing` / `search_products`). The homepage
   lookbook shows the products with `is_featured` on: `listProducts({ featured: true })`.
   Then run `20261128000000_product_specs.sql`: product specs on `products` (`fabric_*`,
   `fabric_weight_gsm`, `origin_*`, `care_*`, `care_icons`, `model_height_cm`, `model_size_code`,
   `delivery_note_*`) and a one-row `store_settings` table (delivery & returns text, delivery days,
   free exchange days, free delivery threshold, cash on delivery). `admin_save_product()` saves the
   new fields only when their keys are sent. Optional sample data: `supabase/seed_product_specs.sql`.
   Then run `20261129000000_reviews.sql`: `reviews` (one per customer per product: `rating` 1–5 +
   `body`; name copied from `profiles.full_name`; saved `pending`, public only when an admin sets
   `approved`; editing sends it back to `pending`; `is_verified` set by admins). Read with the
   `product_review_stats` view (count, average, stars breakdown), `list_reviews(product_slug, sort,
   page, page_size)` and `my_review(product_slug)`. `user_id` is not readable by visitors.
6. Use `@/lib/catalog` (`listProducts`, `getProductBySlug`, `getFilterOptions`) or the RTK Query hooks in
   `@/store/services/products`. Filtering runs in the `search_products` Postgres function; sorting,
   pagination (`range`) and the total count (`count: "exact"`) are added by the client.
   RLS allows public read of active rows only; there are no write policies for the anon key.
