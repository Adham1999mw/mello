# حسابات العملاء: تسجيل، دخول، Google، ونسيت كلمة السر

(English summary at the bottom.)

## اللي اتعمل لحد دلوقتي (الـ backend بس)

- قاعدة البيانات: جدول `profiles` وجدول `addresses`، والـ trigger، والصلاحيات (RLS).
  الملف: [`supabase/migrations/20261127000000_customers.sql`](../supabase/migrations/20261127000000_customers.sql).
- كود الحسابات في [`src/lib/auth`](../src/lib/auth/index.ts): `signUp`، `signIn`، `signInWithGoogle`،
  `sendPasswordReset`، `verifyRecoveryLink`، `updatePassword`، `signOut`، `fetchProfile`، `saveProfile`،
  و `useCustomerSession()`.
- **الصفحات لسه** (تسجيل، دخول، نسيت كلمة السر، كلمة سر جديدة، حسابي). هتتعمل بعدين وتستخدم الكود ده.
  الروابط اللي الكود بيرجّع ليها: `/ar/account/` بعد Google، و `/ar/reset-password/` من إيميل نسيت كلمة السر.

## الإيميلات

- **التسجيل مش بيبعت أي إيميل** طول ما **Confirm email** مقفول: العميل بيدخل على طول.
- الإيميل الوحيد هو **لينك نسيت كلمة السر**.
- لو فتحت **Confirm email** بعدين، مفيش تغيير في الكود: `signUp()` بترجّع `signedIn: false`، فصفحة التسجيل تقول «شوفي إيميلك»
  ولينك التأكيد هيرجّعه على `/account/`.

## الأمان والأدمن

- أي حد يعمل حساب بيبقى **عميل عادي**. الأدمن هو بس اللي ليه صف في جدول `admins`، والجدول ده مفيش أي حد
  يقدر يضيف فيه من الموقع (من الـ SQL Editor بس). فلوحة التحكم بتفضل آمنة حتى والتسجيل مفتوح.
- لو عميل فتح `/ar/admin/` هيشوف «الحساب ده مش أدمن» ومش هيقدر يغيّر أي حاجة.
- كل عميل بيشوف ويعدّل بياناته وعناوينه هو بس (RLS).

## الجداول

**`profiles`**: صف لكل حساب، بيتعمل لوحده بـ trigger أول ما الحساب يتعمل (حتى لو بـ Google).

| العمود | |
| --- | --- |
| `id` | نفس id الحساب في `auth.users` |
| `full_name` | الاسم بالكامل (من الفورم أو من Google) |
| `phone` | موبايل مصري 11 رقم (`01xxxxxxxxx`). **اختياري**: هيتطلب في صفحة الدفع، مش وقت التسجيل |
| `created_at`, `updated_at` | |

الإيميل مش متكرر هنا، بيفضل في `auth.users`.

**`addresses`**: عناوين التوصيل (العميل يقدر يحفظ أكتر من عنوان، وواحد بس افتراضي). جاهز للـ checkout بعدين.

`label` (البيت / الشغل)، `recipient_name`، `phone`، `governorate` (المحافظة)، `city` (المدينة / المنطقة)،
`street`، `building`، `floor`، `apartment`، `landmark` (علامة مميزة)، `is_default`.

## الخطوات اللي إنت محتاج تعملها (مرة واحدة)

### 1. شغّل الـ SQL

SQL Editor → New query → الصق
[`supabase/migrations/20261127000000_customers.sql`](../supabase/migrations/20261127000000_customers.sql) → **Run**.

### 2. إعدادات الدخول في Supabase

**Authentication** → **Sign In / Providers**:

- **Allow new users to sign up**: **افتحه** (لو كنت قفلته وقت الأدمن).
- **Email**: سيبه شغال، واقفل **Confirm email**.

### 3. روابط الموقع

**Authentication** → **URL Configuration**:

- **Site URL**: `https://adham1999mw.github.io/mello/ar/`
- **Redirect URLs** → **Add URL**، ضيف الاتنين دول:
  - `https://adham1999mw.github.io/mello/**`
  - `http://localhost:3000/**`

(لو عندك دومين خاص أو سيرفر، ضيفه بنفس الشكل، مثلًا `https://needle.com/**`.)

### 4. Google

**في Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):

1. اعمل مشروع جديد (أو اختار مشروع).
2. **APIs & Services** → **OAuth consent screen** (أو **Google Auth Platform**): اختار **External**، اكتب اسم
   المتجر وإيميلك، وبعدين **Publish app** عشان أي حد يقدر يدخل مش بس الـ test users.
3. **Credentials** → **Create credentials** → **OAuth client ID** → النوع **Web application**:
   - **Authorized JavaScript origins**: `https://adham1999mw.github.io` و `http://localhost:3000`
   - **Authorized redirect URIs**: `https://nodzpetncbzgrcanvpgt.supabase.co/auth/v1/callback`
     (تلاقيه بالظبط في Supabase تحت Google provider، اسمه **Callback URL**)
4. انسخ **Client ID** و **Client secret**.

**في Supabase**: **Authentication** → **Sign In / Providers** → **Google** → شغّله، والصق الـ Client ID
والـ Client secret → **Save**.

### 5. إيميل نسيت كلمة السر

**أ. خلي الإيميل يوصل للعملاء** (مهم): الإيميل المدمج في Supabase بيبعت بس لأعضاء فريق المشروع وعدد قليل
جدًا. اربط SMTP مجاني: **Authentication** → **Emails** → **SMTP Settings**. مثلًا Resend
(حوالي 3000 إيميل في الشهر ببلاش).

**ب. غيّر شكل الإيميل** (عشان اللينك يشتغل حتى لو اتفتح من تطبيق Gmail أو موبايل تاني):
**Authentication** → **Emails** → **Templates** → **Reset password**، وحط ده:

- **Subject**: `تغيير كلمة السر | Needle`
- **Body**:

```html
<h2>تغيير كلمة السر</h2>
<p>طلبتي تغيير كلمة السر لحسابك في Needle. دوسي على اللينك ده واختاري كلمة سر جديدة:</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">اختاري كلمة سر جديدة</a></p>
<p>اللينك بيشتغل مرة واحدة ولمدة ساعة. لو مش إنتِ اللي طلبتي، تجاهلي الإيميل ده.</p>
```

من غير الخطوة دي اللينك برضه بيشتغل، بس لازم يتفتح في نفس المتصفح اللي العميل طلب منه.

## English summary

- Backend only for now: the migration and the client helpers in `src/lib/auth`. The pages
  (`sign-up`, `sign-in`, `forgot-password`, `reset-password`, `account` under `/ar/` and `/en/`) come next.
- Sign-up sends `{ full_name }` (phone optional, asked at checkout) as user metadata; the `handle_new_user()` trigger copies it (or the
  Google name) into `public.profiles`. `public.addresses` holds delivery addresses. RLS: own rows only;
  admins can read both.
- No email on sign-up while "Confirm email" is off. If it is turned on, `signUp()` returns no session and
  the page shows "check your email"; no code change needed.
- Forgot password: `resetPasswordForEmail` with `redirectTo` = `/reset-password/`. That page accepts
  `?token_hash=&type=recovery` (custom template above, works across browsers) or the default PKCE `?code=`.
- Google: `signInWithOAuth({ provider: "google", redirectTo: /account/ })`.
- Supabase: run `20261127000000_customers.sql`; turn **on** "Allow new users to sign up", **off** "Confirm
  email"; add the site and localhost to Redirect URLs; enable Google; set up SMTP.
- Admin access is unchanged: only rows in `public.admins` (SQL Editor only) pass `is_admin()`.
