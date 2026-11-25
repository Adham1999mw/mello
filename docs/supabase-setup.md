# Supabase: المنتجات والفلاتر خطوة بخطوة

الملف ده بيشرح إزاي تجهز قاعدة بيانات المنتجات على Supabase أول مرة، وإزاي الكود بيستخدمها.
(English summary at the bottom.)

---

## الفكرة ببساطة

- **Supabase** = قاعدة بيانات Postgres جاهزة على النت، ومعاها API أوتوماتيك لكل جدول.
- الموقع بتاعنا على GitHub Pages ملفات static من غير سيرفر، فالمتصفح بيكلم Supabase **مباشرة**.
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
3. (اختياري بس مفيد للتجربة) **New query** تاني، والصق [`supabase/seed.sql`](../supabase/seed.sql) ودوس **Run**.
   ده بيضيف 6 منتجات تجريبية بألوان ومقاسات ومخزون وصور مؤقتة.
4. اتأكد: **Table Editor** → هتلاقي `products` و `product_variants` وباقي الجداول وفيها بيانات.

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

### 5. حطهم في GitHub (عشان GitHub Pages)

الريبو → **Settings** → **Secrets and variables** → **Actions** → تاب **Variables** → **New repository variable**:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | الـ Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام |

بنحطهم **Variables** مش Secrets، لأن الـ workflow بيقرا `vars.` والمفتاح العام أصلا بيبان في المتصفح
(وده عادي، الـ RLS هي اللي بتحمي البيانات).

### 6. إضافة منتجات حقيقية

- **Table Editor** → `products` → **Insert row**: الـ `slug` (إنجليزي صغير بشرطة، مثلا `amira-dress`)،
  الاسم عربي وإنجليزي، والقسم.
- بعدين `product_variants`: صف لكل لون × مقاس بتبيعه، بالـ SKU والسعر والمخزون.
- الصور: **Storage** → `product-images` → ارفع الصورة → وفي `product_images` اكتب مسار الملف
  (مثلا `dresses/amira-black-1.webp`) أو لينك كامل. `sort_order = 0` يبقى صورة الكارت.
- عايز تخفي منتج من غير ما تمسحه؟ خلي `is_active = false`.

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
2. SQL Editor: run `supabase/migrations/20261125000000_catalog.sql`, then optionally `supabase/seed.sql`.
3. Copy the Project URL and the anon / publishable key (never the service_role / secret key).
4. Put them in `.env.local` and in GitHub → Settings → Secrets and variables → Actions → **Variables**.
5. Use `@/lib/catalog` (`listProducts`, `getProductBySlug`, `getFilterOptions`) or the RTK Query hooks in
   `@/store/services/products`. Filtering runs in the `search_products` Postgres function; sorting,
   pagination (`range`) and the total count (`count: "exact"`) are added by the client.
   RLS allows public read of active rows only; there are no write policies for the anon key.
