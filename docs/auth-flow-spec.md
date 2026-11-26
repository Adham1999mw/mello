# Customer sign-in flow: front-end build spec (Atelier v2)

Everything needed to build the customer auth screens in the Needle storefront: sign in, sign up
(2 steps, with a +20 mobile number), Google, add-mobile after Google, forgot password, reset password,
and every error and success state. It also defines the **input design system** (rounded fields) and
the button changes these screens need.

- Approved design: **Atelier v2**. Interactive preview: https://claude.ai/artifact/6rG7Mpqhg7qT6k4MEXmSx8
  (tabs: Flow, Input system, UX decisions).
- Backend: PR 10, `src/lib/auth/index.ts` (`signUp`, `signIn`, `signInWithGoogle`, `sendPasswordReset`,
  `verifyRecoveryLink`, `updatePassword`, `fetchProfile`, `saveProfile`, `useCustomerSession`,
  `normalizePhone`, `isValidPhone`, `isValidEmail`, `authErrorReason`, `MIN_PASSWORD_LENGTH`).
  Build this on top of PR 10 (merge it first, or branch from it).
- Repo rules apply (CLAUDE.md): mobile first with min-width breakpoints only, brand tokens only,
  `Button` / `IconButton` / `Typography` from `@/components/ui`, logical properties for RTL,
  every string in `en.ts` and `ar.ts`, pages must work as static files on GitHub Pages.

---

## 1. Routes and files

All pages are static (no `getServerSideProps`). They use the browser Supabase client from PR 10,
so they work on GitHub Pages. Each page exports `getStaticPaths` / `getStaticProps` from `@/i18n/static`.

| Route | File | Screens |
| --- | --- | --- |
| `/[locale]/sign-in/` | `src/pages/[locale]/sign-in.tsx` → `AuthPage` | One page with two tabs. **Sign in** tab: sign in, wrong password. **Create account** tab: step 1 About you, step 2 Login, errors, Welcome |
| `/[locale]/forgot-password/` | `src/pages/[locale]/forgot-password.tsx` | Forgot password, Email sent |
| `/[locale]/reset-password/` | `src/pages/[locale]/reset-password.tsx` | Checking link, New password, Link expired, Password saved |
| `/[locale]/account/complete/` | `src/pages/[locale]/account/complete.tsx` | Add mobile (after Google) |
| `/[locale]/account/` | (account page, later) | Redirects to `complete/` when the phone is missing (see 7.6) |

Query parameters:

- `?tab=sign-up` on sign-in: opens the Create account tab. No `tab` means the Sign in tab.
  Build these URLs with `authHref(locale, { tab, step })` from `components/auth/useAuthPage.ts`.
- After a successful sign-in or sign-up she always goes to the home page (`AFTER_AUTH_PATH` in
  `useAuthPage.ts`). There is no `?next=` parameter.
- `?step=2` on the Create account tab: step 2 is a real history entry, so the phone back button
  returns to step 1. Switching tabs uses `router.replace` (no history entry) and drops `step`.

New folders:

```
src/components/ui/
  TextField.tsx          # the input system (section 4)
  PasswordField.tsx
  PhoneField.tsx
  FieldMessage.tsx
  PasswordRules.tsx
  SegmentedTabs.tsx      # rounded Sign in / Create account switch
src/components/auth/
  AuthLayout.tsx         # brand panel + form sheet (section 6)
  BrandPanel.tsx
  GoogleButton.tsx
  AuthHeader.tsx         # eyebrow + title + subtitle block
  StepProgress.tsx
  StatusBadge.tsx        # round icon at the top of success / sent / expired screens
  AccountSummary.tsx     # the leather "Sara Ahmed · +20 10 1234 5678 · Edit" strip
  ContextBanner.tsx      # "Your bag of 2 pieces is saved"
  ResendButton.tsx       # countdown button
src/lib/auth/form.ts     # phone formatting, password rules, browser storage, error messages (section 8)
```

Export the new `ui` components from `src/components/ui/index.ts` and add live examples of each one
to `/[locale]/design-system/`.

---

## 2. Tokens (add before building)

### 2.1 `src/theme/brand.ts`

```ts
export const COLORS = {
  // ...existing
  /** Valid fields, "passwords match", password rule chips. Readable on ivory and white. */
  success: "#2E6B3C",
} as const;

export const LAYOUT = {
  // ...existing
  /** Radius for form fields and the buttons next to them. The rest of the brand stays sharp (radius). */
  radiusField: 14,
  /** Height of a form field and of a form's buttons. */
  fieldHeight: 54,
  /** Radius of the phone sheet that slides over the brand panel. */
  radiusSheet: 24,
} as const;
```

### 2.2 `src/styles/globals.css` → `@theme inline` (keep in sync with brand.ts)

```css
  --color-success: #2e6b3c;
  /* LAYOUT.radiusField: form fields and their buttons */
  --radius-field: 14px;
  /* LAYOUT.radiusSheet */
  --radius-sheet: 24px;
```

This gives Tailwind `text-success`, `bg-success/10`, `rounded-field`, `rounded-sheet`.
Use `min-h-[54px]` for the field height (or add `--spacing-field: 54px` if you prefer `h-field`).

### 2.3 Colour use on these screens

| Use | Token |
| --- | --- |
| Brand panel | `burgundy` → `burgundy-deep` gradient, `wine` glow at the top |
| Form sheet / page | `ivory` |
| Field fill | `white` |
| Field border | `ink/18`, hover `ink/36`, focus `burgundy` + `ring-4 ring-burgundy/10` |
| Error | `danger` border, fill `#FFF8F7` → use `bg-danger/[0.03]`, ring `danger/12` |
| Valid | `success` |
| Disabled field | `bg-ink/[0.04]`, border `ink/10`, text `ink/45` |
| Read-only field | `bg-leather`, no border |
| Title | `burgundy`, `<em>` in `wine` |
| Eyebrow | `wine` |
| Body / helper | `ink-muted` |
| Context banner, account summary, status badge | `leather` fill |
| Primary button | `burgundy` fill, `champagne` text |

---

## 3. Buttons

The forms use the existing `Button`, with one new prop so the buttons match the rounded fields
(CLAUDE.md 2a: add a variant in `ui/`, don't override in place).

### 3.1 Add `shape` to `Button` (and `buttonClasses`)

```ts
export type ButtonShape = "sharp" | "field";
// in CommonProps
/** "field": 14px corners and 54px height, for buttons inside forms next to TextFields. Default "sharp". */
shape?: ButtonShape;
```

In `buttonClasses`: when `shape === "field"` and the variant is not `link`, replace `rounded-brand` +
`SIZES[size]` with `rounded-field min-h-[54px] px-5`. Everything else (tones, typography, focus) stays.

### 3.2 Buttons on the auth screens

| Button | Code |
| --- | --- |
| Primary (Sign in, Continue, Create account, Send link, Save) | `<Button type="submit" shape="field" fullWidth>` (solid, burgundy) |
| Secondary (Go to my account, Resend link) | `<Button variant="outline" shape="field" fullWidth>` |
| Text links (Forgot password?, Back to sign in, Sign in instead, Edit, Continue as guest, Add it at checkout) | `<Button variant="link">` or a `next/link` with `className={typography("label")}` — 44px tall |
| Google | `<GoogleButton>` (3.3) |
| Back / close in the brand panel | `<IconButton label tone="champagne">` |

Loading state: while a request runs, the submit button gets `disabled`, `aria-busy="true"` and a
16px spinner as `startIcon` (1.5px `currentColor` ring, transparent top, `animate-spin`; slow it to
2.4s under `motion-reduce:`). Keep the label so the width doesn't jump.

### 3.3 `GoogleButton` (`src/components/auth/GoogleButton.tsx`)

- `<Button variant="outline" tone="ink" shape="field" fullWidth startIcon={<GoogleG />}>`, with a white
  fill: add `bg-white` through a new tone if needed, or render with `buttonClasses(...)` + `bg-white` in
  this one component (the only allowed exception, documented in the file).
- Text is sentence case, not the uppercase button style: use `typography("body")` for the label.
- The "G" is Google's official 4-colour mark, 18px, inline SVG (paths are in the preview page source).
- `onClick`: `signInWithGoogle(locale)`. Show the spinner until the page leaves. On error show the
  generic error banner.
- Before leaving, set `sessionStorage` `needle:auth-from-google` (wrap in try/catch). `/account/`
  reads it after Google returns and goes on to the home page (see 7.6).

### 3.4 `SegmentedTabs` (`src/components/ui/SegmentedTabs.tsx`)

The rounded switch at the top of sign in / sign up.

- Track: `grid grid-cols-2 p-1 rounded-full bg-ink/[0.06]`.
- Item: `min-h-11 rounded-full grid place-items-center text-[14.5px] text-ink-muted`.
- Selected: `bg-white text-burgundy font-medium shadow-[0_1px_2px_rgba(42,4,13,.12),0_4px_12px_-6px_rgba(42,4,13,.25)]`.
- Two modes:
  - **Tabs in one page** (the auth page): give every item `onSelect`, `id` and `controls`. It renders
    `role="tablist"` with `role="tab"` buttons (`aria-selected`, `aria-controls`, roving `tabIndex`),
    and Left/Right arrow keys move between tabs (swapped in Arabic). Each panel is
    `role="tabpanel"` with the `controls` id and `aria-labelledby` the tab id.
  - **Links to other pages**: give every item `href`. It renders a `<nav>` with `aria-current="page"`.
- On the auth page both forms stay mounted and the hidden panel gets `hidden`, so what she typed in
  one tab is still there when she comes back. The email typed in one tab also prefills the other
  tab's empty email (`sessionStorage` `needle:auth-email`).
- Switching tabs keeps focus on the tab (it does not jump to the title).

---

## 4. Input design system

One field family for every form in the store (auth, checkout, account, admin later).

### 4.1 Anatomy

```
[1 Label ................................. 2 Optional]
┌───────────────────────────────────────────────────┐
│ 3 Prefix │ 4 Input text                 │ 5 End   │   54px tall, 14px corners
└───────────────────────────────────────────────────┘
 6 ⓘ Helper or error text
```

1. **Label**: 14px, weight 500, `ink`, always visible above the field. No floating labels (they shrink
   and get lost in Arabic) and no placeholder-as-label.
2. **Optional tag**: `optional` prop shows "Optional" / "اختياري" at the inline end of the label row,
   regular weight, `ink-muted`. Required is the default, so there is no asterisk.
3. **Prefix slot** (optional): e.g. `+20` with the Egypt flag. `px-[14px] pe-3`, divided from the input
   by `border-e border-ink/14`.
4. **Input**: 16px text (stops iOS zoom), `px-4`, `ink`, placeholder `ink-muted/60`.
5. **End slot** (optional): 48px wide. Holds the eye toggle, the valid check, or a clear button.
6. **Message line**: 13.5px, line-height 1.45, `ink-muted` for a hint, `danger` + alert icon for an
   error, `success` + check icon for a success. 8px below the field.

### 4.2 Specs

| Part | Value | Tailwind |
| --- | --- | --- |
| Height | 54px (never below 52) | `min-h-[54px]` |
| Radius | 14px | `rounded-field` |
| Fill | white | `bg-white` |
| Border | 1px ink 18% | `border border-ink/[0.18]` |
| Hover | border ink 36% | `hover:border-ink/[0.36]` |
| Focus | burgundy border + 4px ring 10% | `focus-within:border-burgundy focus-within:ring-4 focus-within:ring-burgundy/10` |
| Error | danger border, faint red fill, ring 12% on focus | `border-danger bg-danger/[0.03] focus-within:ring-danger/12` |
| Valid | green check in end slot | `text-success` |
| Disabled | ink 4% fill, border 10%, text 45%, `cursor-not-allowed` | `bg-ink/[0.04] border-ink/10 text-ink/45` |
| Read-only | leather fill, no border | `bg-leather border-transparent` |
| Label → field gap | 8px | `gap-2` |
| Field → field gap | 18px | `gap-[18px]` on the form |
| Transition | border, ring, fill 150ms | `transition-[border-color,box-shadow,background-color] duration-150` |
| Tap targets | eye / clear / links ≥ 44px | `min-w-11 min-h-11` |

### 4.3 States

| State | When | Look |
| --- | --- | --- |
| Default | empty, not focused | white, 18% border, placeholder only if it helps (phone: `10 1234 5678`) |
| Hover | pointer over | 36% border |
| Focus | typing | burgundy border + ring |
| Filled | has a value | same as default, value in `ink` |
| Valid | value passes its check (name, phone) | green check in end slot. Don't show on email or password |
| Error | failed validation or server error | danger border, red fill, error line with icon, `aria-invalid="true"` |
| Disabled | while the form submits, or not editable yet | 4% fill, 45% text, `disabled` |
| Read-only | known value she can't change here | leather fill, `readOnly` |

Validation timing: validate a field **on blur** and **on submit**, never on the first keystroke.
Once a field shows an error, re-validate it **on every change** so the error clears as soon as it's fixed.
On submit with errors, focus the first invalid field.

### 4.4 `TextField` API

```tsx
type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  /** Shows "Optional" on the label row. */
  optional?: boolean;
  hint?: string;
  /** Error text. Also sets aria-invalid and the error look. */
  error?: string;
  /** Success text under the field ("Passwords match"). */
  success?: string;
  /** Show the green check in the end slot. */
  valid?: boolean;
  prefix?: ReactNode;
  end?: ReactNode;
  /** Force left-to-right (email, password, phone) inside an Arabic page. */
  ltr?: boolean;
  className?: string; // layout only
};
```

Rules inside the component:

- `id` from `useId()` unless passed. `<label htmlFor>`; message gets `id={`${id}-msg`}` and the input
  `aria-describedby` points to it.
- `ltr`: put `dir="ltr"` on the field box and the input. In an RTL page also add `text-right` to the
  input so the value lines up with the Arabic label (preview does this). The label stays RTL.
- `forwardRef` to the input (forms need to focus the first error).
- Error and success lines start with an icon, so meaning doesn't rely on colour alone.
- Error line uses `role="alert"` only when it appears after submit; plain hints are not live.

### 4.5 `PasswordField`

`TextField` + eye toggle in the end slot.

- Eye: 48px wide button, `aria-label` "Show password" / "Hide password", `aria-pressed` reflects
  visibility. Icons: open eye / slashed eye, 20px, `ink-muted`.
- Toggling keeps focus and caret position.
- `autoComplete="current-password"` on sign in, `"new-password"` on sign up and reset.
- `showRules` prop renders `PasswordRules` under the field (sign up, reset).

### 4.6 `PasswordRules`

Three chips that turn green as she types. They replace a strength meter.

| Rule | Check | EN | AR |
| --- | --- | --- | --- |
| Length | `value.length >= MIN_PASSWORD_LENGTH` (8) | 8+ characters | ٨ أحرف أو أكثر |
| Letter | `/[A-Za-z؀-ۿ]/` | A letter | حرف |
| Number | `/[0-9٠-٩]/` | A number | رقم |

- Chip: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] bg-ink/5 text-ink-muted`,
  check icon at 35% opacity. Met: `bg-success/10 text-success`, icon full opacity.
- Wrap with `flex flex-wrap gap-1.5`. Announce changes politely: one visually hidden
  `aria-live="polite"` line, e.g. "2 of 3 rules met".
- Submit is allowed only when all three pass. If she submits early, show the error
  "Use at least 8 characters with a letter and a number."

### 4.7 `PhoneField` (+20)

`TextField` with a fixed Egypt prefix.

- Prefix: Egypt flag (20×14, 3px radius, red / white / black stripes; inline SVG) + `+20`, tabular nums.
  Not editable, `aria-hidden`. The input's accessible name includes it: label "Mobile number",
  `aria-describedby` hint, and a visually hidden "+20" before the input.
- Whole field is `dir="ltr"`, also in Arabic (numbers read left to right).
- Input: `type="tel"`, `inputMode="tel"`, `autoComplete="tel-national"`, placeholder `10 1234 5678`,
  `tabular-nums tracking-[0.04em]`.
- As she types or pastes, run `phoneDigits()` (8.1) and show `formatPhone()` → `10 1234 5678`.
  Accepts Arabic or Persian digits, spaces, dashes, a leading `0`, `+20`, `0020`.
- Valid (`/^1[0125]\d{8}$/`): green check in the end slot.
- 10 digits but invalid prefix: error right away. Fewer than 10 digits: error only on blur / submit.
- Error text: "Egyptian mobile numbers start with 10, 11, 12 or 15 and have 10 digits." /
  "رقم الموبايل المصري يبدأ بـ 10 أو 11 أو 12 أو 15 ويتكوّن من 10 أرقام."
- Value given to the form: `toLocalPhone(digits)` = `"0" + digits` → `01012345678`, the format
  `normalizePhone` / `isValidPhone` in PR 10 and the database expect.
- Hint: "We'll use it for delivery updates only." / "نستخدمه لتحديثات التوصيل فقط."

### 4.8 `FieldMessage`

Small shared piece: `{ tone: "hint" | "error" | "success"; id; children }`. Icons: alert circle (error),
check (success), none (hint). 16px icons, `mt-0.5`, `gap-[7px]`.

---

## 5. Shared auth components

| Component | Spec |
| --- | --- |
| `AuthHeader` | `eyebrow` (`Typography variant="eyebrow"`, `text-wine`), `title` (`Typography variant="h1"`, `text-burgundy`; an `<em>` inside is italic `wine` in English, upright in Arabic), `subtitle` (`variant="body"`, `text-ink-muted`). Gap 8px. The title is the page's `<h1>`. |
| `StepProgress` | Text "Step 1 of 2 · About you" (12.5px, `ink-muted`) + two 4px bars, `rounded-full`, `gap-1.5`; done/current `bg-burgundy`, next `bg-ink/10`. `aria-label` on the wrapper: "Step 1 of 2". |
| `StatusBadge` | 64px circle, `bg-leather text-burgundy`, 28px line icon (check / mail / clock). Sits above `AuthHeader`, start-aligned. Decorative (`aria-hidden`). |
| `AccountSummary` | Leather strip, `rounded-field px-3.5 py-2.5 flex items-center gap-3`: 36px burgundy avatar circle with the first letter in `font-display` champagne, name + small line (phone or email, `dir="ltr"`), optional "Edit" link at the end. |
| `ContextBanner` | Leather strip, `rounded-field`, bag icon + text. Only on sign-in / sign-up when `next` starts with `/checkout`. EN: "Sign in to check out faster. Your bag of **{count} pieces** is saved." Use the bag count from the store; if 0, hide the banner. |
| `ErrorBanner` | For errors that aren't about one field (wrong password, network, rate limit). `rounded-field bg-danger/[0.07] text-danger px-3.5 py-3 text-sm`, alert icon, `role="alert"`, placed under `AuthHeader`, focused after submit. |
| `ResendButton` | Secondary button, disabled with "Resend in 0:59" (tabular nums) counting down from 60s, then "Resend link". After a resend, restart the countdown. Rate-limit errors (`rateLimited`) restart it too. |
| "or with email" divider | `grid grid-cols-[1fr_auto_1fr] items-center gap-3.5 text-[13px] text-ink-muted`, lines `h-px bg-current opacity-30`. |

---

## 6. Layout: `AuthLayout`

```tsx
<AuthLayout locale={locale} title={pageTitle} back={href?} >
  {form}
</AuthLayout>
```

### 6.1 Phone (base styles)

- Page background `burgundy`. Column: brand panel, then the form sheet.
- **Brand panel**: height 236px including the safe area (use `pt-[env(safe-area-inset-top)]`).
  Contents: back `IconButton` at the inline start, close `IconButton` at the inline end (close goes to
  `next` or home), leather label image centred, ~168px wide, rotated −5°, drop shadow
  `drop-shadow(0 18px 22px rgba(0,0,0,.45))`.
- **Form sheet**: `relative z-10 -mt-6 rounded-t-sheet bg-ivory px-5 pt-[22px] pb-11`, with a
  40×4px grabber (`rounded-full bg-ink/14`, centred, decorative) at the top. Min height fills the rest
  of the screen.
- Form: one column, `flex flex-col gap-[18px]`, full-width buttons.

### 6.2 From `md` (768px) up

- Two columns `md:grid md:grid-cols-2 md:min-h-dvh`. Brand panel at the inline start (left in English,
  right in Arabic, automatically from the grid in RTL).
- Brand panel: full height, label ~330px wide at 44% height, back/close hidden (the store header is
  enough), quote at the bottom centred: "Pieces made *to fit you*, stitch by stitch." /
  "قطع مصنوعة لتناسبكِ، غُرزة بغُرزة." in `font-display` 34px champagne, and under it
  "— MADE IN EGYPT —" (11px, tracking 0.3em, 75% opacity; Arabic 14px, no tracking).
- Form side: `bg-ivory grid place-items-center p-14`, form `w-[400px]`. No sheet radius, no grabber.
- `lg`/`xl`: same, the panel just gets wider.

### 6.3 Brand panel art

- Background: `radial-gradient(90% 120% at 50% 0%, wine 0%, burgundy 55%, burgundy-deep 100%)`
  (build with the CSS variables, no hex).
- Weave texture: two `repeating-linear-gradient`s at ±45°, `champagne` at 3.5% opacity, 7px period.
- Thread: inline SVG, `viewBox="0 0 600 800" preserveAspectRatio="none"`, `aria-hidden`, two paths:
  `M-20 140 C 140 60, 220 300, 330 250 S 520 120, 640 220` and
  `M-20 640 C 160 560, 260 720, 380 660 S 540 560, 640 600` (second at 30% opacity).
  Stroke `champagne`, width 1.4, `stroke-dasharray: 7 6`, round caps, 55% opacity. Slow "sewing"
  animation: `stroke-dashoffset` 0 → −260 over 14s linear infinite; none under `prefers-reduced-motion`.
- Image: `public/brand/needle-label.webp` through `next/image` with `assetPath()`,
  `sizes="(min-width: 768px) 330px, 168px"`, `alt=""` (decorative), `priority` on sign-in only.
- Alternative (kept in the preview): monogram pattern (`needle-monogram-cream.webp` tiled at 92px,
  6% opacity) + a large monogram. Build it behind a `variant="label" | "monogram"` prop, default `label`.

### 6.4 Head

`<title>` via the existing SEO title template: "Sign in | Needle" / "تسجيل الدخول | نيدل" etc.
Add `<meta name="robots" content="noindex">` on all auth pages.

---

## 7. Screens

Common to every form: `<form noValidate onSubmit>`; native `type="email"` / `type="tel"` for keyboards;
submit button is `type="submit"` so Enter works; double submits are blocked while loading.

### 7.0 The auth page — `AuthPage`

`/sign-in/` renders `AuthPage`: `AuthLayout` → `AuthTabs` (`SegmentedTabs` in tab mode) → two tab
panels, `SignInForm` (7.1) and `SignUpForm` (7.2–7.4). The tab comes from `?tab=`. The page sets the
`<title>` per tab and redirects once if she is already signed in. When the account is created, the
Welcome / Check your email screen replaces the tabs (`SignUpForm` reports it with `onStageChange`).

### 7.1 Sign in tab — `/sign-in/`

Order: `SegmentedTabs` (Sign in selected) → `ContextBanner` (only from checkout) → `AuthHeader` →
`ErrorBanner` (if any) → `GoogleButton` → divider → Email → Password → "Forgot password?" link
(inline end, `-mt-2.5`) → **Sign in**.

- Fields: email (`autoComplete="email"`, `ltr`), password (`current-password`).
- Client checks: email present and `isValidEmail`; password present. Errors on the fields.
- Submit: `signIn(email, password)` → `router.replace` to the home page.
- `invalidCredentials`: ErrorBanner "That email and password don't match. Try again, or
  [reset your password]." (link to `/forgot-password/` with the email kept), both fields get the
  error border with no extra text, clear the password, focus it.
- If already signed in (`useCustomerSession().status === "signedIn"`), redirect to the home page.

### 7.2 Create account tab, step 1 — `/sign-in/?tab=sign-up`

Order: `SegmentedTabs` (Create account) → `StepProgress` (1 of 2 · About you) → `AuthHeader` →
`GoogleButton` → divider → Full name → Mobile number (`PhoneField`) → **Continue**.

- Name: required, trimmed, 2–80 characters. `autoComplete="name"`. Valid check when filled.
- Phone: required in this flow (the database column stays nullable for Google users who skip).
- Continue: validate, keep values in component state + `sessionStorage("needle:signup")` (without
  password), `router.push("?step=2", undefined, { shallow: true })`, focus step 2's title.

### 7.3 Create account tab, step 2 — `/sign-in/?tab=sign-up&step=2`

Order: `SegmentedTabs` → `StepProgress` (2 of 2 · Your login) → `AccountSummary` (name,
`+20 10 1234 5678`, "Edit" → step 1) → `AuthHeader` → Email → Password (with `PasswordRules`) →
**Create account** → legal line ("By creating an account you agree to our [Privacy policy]." link to
`/privacy/`).

- If step 1 data is missing (opened directly), go back to step 1.
- Submit: `signUp(locale, { fullName, email, password, phone: toLocalPhone(digits) })`.
  - `signedIn: true` → Welcome (7.4).
  - `signedIn: false` (only if "Confirm email" is turned on later) → "Check your email" screen
    reusing 7.8 with confirmation copy.
- `emailTaken`: error on the email field: "There's already an account with this email.
  [Sign in instead]" (a button that switches to the Sign in tab, where the email is already filled in).
- `weakPassword`: error on password: "Use at least 8 characters with a letter and a number."
- `invalidEmail`: "Enter an email like name@example.com."

### 7.4 Welcome (sign-up success, same page)

`StatusBadge` (check) → `AuthHeader` ("Account created" / "Welcome, *Sara*" using the first name) →
three perks list (icon + text, rows divided by `border-b border-ink/8`, 12px vertical padding):
"Your bag follows you on any device", "Checkout is filled in for you", "Track every order in one place"
→ **Start shopping** (primary, goes to the home page) → **Go to my account**
(secondary, `/account/`). Clear `sessionStorage` keys.

### 7.5 Add mobile after Google — `/account/complete/`

`AccountSummary` (Google G in the avatar, name, email) → `AuthHeader` ("One last thing" / "Add your
*mobile*" / "Google gave us your name and email. Add your number so couriers can reach you.") →
`PhoneField` → **Save and continue** → "Add it at checkout" link.

- Save: `saveProfile(user.id, { phone })` → go to the home page.
- Skip: `localStorage.setItem("needle:phone-skip", "1")` (try/catch) → same destination.
- Signed out → `/sign-in/`.

### 7.6 Where Google lands

`signInWithGoogle` returns to `/account/`. On the account page: once signed in, `fetchProfile`; if
`phone` is null and `needle:phone-skip` isn't set, `router.replace("/account/complete/")`. Otherwise
if `needle:auth-from-google` is set, clear it and go to the home page.

### 7.7 Forgot password — `/forgot-password/`

`AuthHeader` ("Password help" / "Forgot your *password?*" / "Enter the email you signed up with.
We'll send you a link to choose a new password.") → Email (prefilled from sign-in) → **Send reset link**
→ "Back to sign in" link.

- Submit: `sendPasswordReset(locale, email)` → Email sent (7.8). Show 7.8 even if the account doesn't
  exist (never reveal whether an email is registered). `rateLimited` → also 7.8, with the countdown.

### 7.8 Email sent (same page)

`StatusBadge` (mail) → `AuthHeader` ("Link sent" / "Check your *email*" / "If there's a Needle account
for **{email}**, a reset link is on its way. It works for one hour.") → tip "Nothing yet? Look in
spam, or send it again." → `ResendButton` → "Use a different email" (back to 7.7 with the email kept).

### 7.9 Reset password — `/reset-password/`

On load: show a short loading state (spinner in the sheet, "Checking your link…"), then
`verifyRecoveryLink()`.

- `false` → **Link expired** (7.10).
- `true` → form: `AuthHeader` ("Reset password" / "Choose a new *password*" / "For **{email}**" from the
  session user) → New password (`PasswordRules`) → Confirm password → **Save password**.
  - Confirm shows "Passwords match" (success) or, after blur, "Passwords don't match yet" (error).
  - Submit: `updatePassword(password)` → **Password saved** (7.11).
  - `samePassword`: "That's your current password. Choose a new one."
  - `linkExpired` from the update → 7.10.

### 7.10 Link expired

`StatusBadge` (clock) → `AuthHeader` ("Reset password" / "This link has *expired*" / "Reset links work
once, for one hour. Ask for a new one and open the latest email.") → **Send a new link** (to 7.7) →
"Back to sign in".

### 7.11 Password saved

`StatusBadge` (check) → `AuthHeader` ("All set" / "Password *updated*" / "You're signed in with your new
password.") → **Continue shopping** → **Go to my account** (secondary).

---

## 8. Logic helpers — `src/lib/auth/form.ts` and `src/lib/auth/schemas.ts`

### 8.0 Validation: react-hook-form + yup

Every form uses react-hook-form with `yupResolver` and `mode: "onTouched"` (check on blur, then on
every change once a field has an error). One schema per form in `src/lib/auth/schemas.ts`, each built
with `t` so messages are translated: `signInSchema`, `signUpSchema` (+ `SIGN_UP_STEP1_FIELDS` for
`trigger()` on step 1), `forgotPasswordSchema`, `resetPasswordSchema` (confirm uses
`oneOf([ref("password")])`), `addPhoneSchema`. Server errors from Supabase go in with `setError`.

### 8.1 Phone

```ts
/** Any typed/pasted Egyptian mobile → its 10 national digits (no leading 0). */
export function phoneDigits(value: string): string {
  let d = value
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
  if (d.startsWith("0020")) d = d.slice(4);
  else if (d.startsWith("20") && d.length > 10) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}
/** "1012345678" → "10 1234 5678" */
export const formatPhone = (d: string) => [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10)].filter(Boolean).join(" ");
export const isValidPhoneDigits = (d: string) => /^1[0125]\d{8}$/.test(d);
/** What signUp / saveProfile get: "01012345678" (matches isValidPhone in index.ts). */
export const toLocalPhone = (d: string) => `0${d}`;
```

Keep the caret sensible while formatting: compute the caret from the count of digits before it.

### 8.2 Password

```ts
export const passwordRules = (v: string) => ({
  length: v.length >= MIN_PASSWORD_LENGTH,
  letter: /[A-Za-z؀-ۿ]/.test(v),
  number: /[0-9٠-٩]/.test(v),
});
export const passwordOk = (v: string) => Object.values(passwordRules(v)).every(Boolean);
```

### 8.4 Error reason → message key

| `authErrorReason` | Where | Message key |
| --- | --- | --- |
| `invalidCredentials` | sign-in banner | `auth.errors.invalidCredentials` |
| `emailTaken` | sign-up email field | `auth.errors.emailTaken` |
| `weakPassword` | password field | `auth.errors.weakPassword` |
| `samePassword` | reset password field | `auth.errors.samePassword` |
| `invalidEmail` | email field | `auth.errors.invalidEmail` |
| `rateLimited` | banner (sign in), countdown (forgot) | `auth.errors.rateLimited` |
| `linkExpired` | reset page → expired screen | — |
| `emailNotConfirmed` | sign-in banner | `auth.errors.emailNotConfirmed` |
| `signupDisabled` | sign-up banner | `auth.errors.signupDisabled` |
| `generic` / network | banner | `auth.errors.generic` |

---

## 9. Copy (add to `en.ts` and `ar.ts` under `auth`)

Arabic addresses the customer in the feminine, like the rest of the store. `{name}`, `{email}`,
`{count}`, `{seconds}` are placeholders. Parts in `*…*` are the `<em>` of the title (build them as
`titleStart` / `titleEm` / `titleEnd` like `home.hero`, or render a small `*em*` parser).

```ts
// en.ts
auth: {
  tabs: { signIn: "Sign in", signUp: "Create account" },
  google: "Continue with Google",
  orEmail: "or with email",
  fields: {
    email: "Email", emailPlaceholder: "name@example.com",
    password: "Password", newPassword: "New password", confirmPassword: "Confirm password",
    name: "Full name", phone: "Mobile number", phoneHint: "We'll use it for delivery updates only.",
    optional: "Optional", showPassword: "Show password", hidePassword: "Hide password",
  },
  rules: { length: "8+ characters", letter: "A letter", number: "A number", summary: "{met} of 3 rules met" },
  brand: { quote: "Pieces made *to fit you*, stitch by stitch.", made: "Made in Egypt", back: "Back", close: "Close" },
  signIn: {
    eyebrow: "Welcome back", title: "Sign *in*", subtitle: "Follow your orders and check out faster.",
    submit: "Sign in", forgot: "Forgot password?",
    context: "Sign in to check out faster. Your bag of {count} pieces is saved.", guest: "Continue as guest",
  },
  signUp: {
    step1: "Step 1 of 2 · About you", step2: "Step 2 of 2 · Your login",
    eyebrow1: "Join Needle", title1: "Let's start with *you*", subtitle1: "Your name and mobile, so deliveries reach you.",
    continue: "Continue",
    eyebrow2: "Almost there", title2: "Create your *login*", subtitle2: "You'll sign in with this email and password.",
    submit: "Create account", edit: "Edit",
    legal: "By creating an account you agree to our {link}.", privacy: "Privacy policy",
  },
  welcome: {
    eyebrow: "Account created", title: "Welcome, *{name}*", subtitle: "You're signed in. Here's what your account does for you:",
    perks: ["Your bag follows you on any device", "Checkout is filled in for you", "Track every order in one place"],
    shop: "Start shopping", account: "Go to my account",
  },
  addPhone: {
    eyebrow: "One last thing", title: "Add your *mobile*",
    subtitle: "Google gave us your name and email. Add your number so couriers can reach you.",
    submit: "Save and continue", skip: "Add it at checkout",
  },
  forgot: {
    eyebrow: "Password help", title: "Forgot your *password?*",
    subtitle: "Enter the email you signed up with. We'll send you a link to choose a new password.",
    submit: "Send reset link", back: "Back to sign in",
  },
  sent: {
    eyebrow: "Link sent", title: "Check your *email*",
    subtitle: "If there's a Needle account for {email}, a reset link is on its way. It works for one hour.",
    tip: "Nothing yet? Look in spam, or send it again.",
    resend: "Resend link", resendIn: "Resend in {seconds}", other: "Use a different email",
  },
  reset: {
    checking: "Checking your link…",
    eyebrow: "Reset password", title: "Choose a new *password*", subtitle: "For {email}",
    match: "Passwords match", noMatch: "Passwords don't match yet", submit: "Save password",
  },
  expired: {
    eyebrow: "Reset password", title: "This link has *expired*",
    subtitle: "Reset links work once, for one hour. Ask for a new one and open the latest email.",
    submit: "Send a new link", back: "Back to sign in",
  },
  done: {
    eyebrow: "All set", title: "Password *updated*", subtitle: "You're signed in with your new password.",
    shop: "Continue shopping", account: "Go to my account",
  },
  errors: {
    required: "Fill in this field.",
    name: "Enter your full name.",
    invalidEmail: "Enter an email like name@example.com.",
    phone: "Egyptian mobile numbers start with 10, 11, 12 or 15 and have 10 digits.",
    weakPassword: "Use at least 8 characters with a letter and a number.",
    invalidCredentials: "That email and password don't match. Try again, or {link}.",
    resetLink: "reset your password",
    emailTaken: "There's already an account with this email.",
    signInInstead: "Sign in instead",
    samePassword: "That's your current password. Choose a new one.",
    rateLimited: "Too many tries. Wait a minute and try again.",
    emailNotConfirmed: "Confirm your email first. Check your inbox for the link.",
    signupDisabled: "New accounts are paused right now. Try again later.",
    generic: "Something went wrong. Check your connection and try again.",
  },
  seo: {
    signIn: "Sign in", signUp: "Create account", forgot: "Forgot password",
    reset: "Reset password", addPhone: "Add your mobile",
  },
},
```

```ts
// ar.ts
auth: {
  tabs: { signIn: "تسجيل الدخول", signUp: "حساب جديد" },
  google: "المتابعة بحساب Google",
  orEmail: "أو بالبريد الإلكتروني",
  fields: {
    email: "البريد الإلكتروني", emailPlaceholder: "name@example.com",
    password: "كلمة السر", newPassword: "كلمة السر الجديدة", confirmPassword: "تأكيد كلمة السر",
    name: "الاسم بالكامل", phone: "رقم الموبايل", phoneHint: "نستخدمه لتحديثات التوصيل فقط.",
    optional: "اختياري", showPassword: "إظهار كلمة السر", hidePassword: "إخفاء كلمة السر",
  },
  rules: { length: "٨ أحرف أو أكثر", letter: "حرف", number: "رقم", summary: "تحقق {met} من ٣ شروط" },
  brand: { quote: "قطع مصنوعة *لتناسبكِ*، غُرزة بغُرزة.", made: "صُنع في مصر", back: "رجوع", close: "إغلاق" },
  signIn: {
    eyebrow: "أهلاً بعودتكِ", title: "تسجيل *الدخول*", subtitle: "تابعي طلباتكِ وأتمّي الشراء أسرع.",
    submit: "دخول", forgot: "نسيتِ كلمة السر؟",
    context: "سجّلي الدخول لإتمام الطلب أسرع. حقيبتكِ فيها {count} قطع ومحفوظة.", guest: "المتابعة كضيفة",
  },
  signUp: {
    step1: "الخطوة ١ من ٢ · بياناتكِ", step2: "الخطوة ٢ من ٢ · بيانات الدخول",
    eyebrow1: "انضمي إلى نيدل", title1: "لنبدأ *بكِ*", subtitle1: "اسمكِ ورقم الموبايل، حتى يصلكِ طلبكِ.",
    continue: "متابعة",
    eyebrow2: "اقتربنا", title2: "بيانات *الدخول*", subtitle2: "ستسجّلين الدخول بهذا البريد وكلمة السر.",
    submit: "إنشاء الحساب", edit: "تعديل",
    legal: "بإنشاء الحساب، أنتِ توافقين على {link}.", privacy: "سياسة الخصوصية",
  },
  welcome: {
    eyebrow: "تم إنشاء الحساب", title: "أهلاً بكِ يا *{name}*", subtitle: "تم تسجيل دخولكِ. هذا ما يقدّمه لكِ حسابكِ:",
    perks: ["حقيبتكِ معكِ على أي جهاز", "بيانات الطلب تُملأ تلقائياً", "تابعي كل طلباتكِ في مكان واحد"],
    shop: "ابدئي التسوق", account: "حسابي",
  },
  addPhone: {
    eyebrow: "خطوة أخيرة", title: "أضيفي رقم *الموبايل*",
    subtitle: "أخذنا اسمكِ وبريدكِ من Google. أضيفي رقمكِ ليتواصل معكِ المندوب.",
    submit: "حفظ ومتابعة", skip: "أضيفه عند إتمام الطلب",
  },
  forgot: {
    eyebrow: "مساعدة", title: "نسيتِ *كلمة السر؟*",
    subtitle: "اكتبي البريد الإلكتروني الذي سجّلتِ به، وسنرسل لكِ رابطاً لاختيار كلمة سر جديدة.",
    submit: "إرسال الرابط", back: "الرجوع لتسجيل الدخول",
  },
  sent: {
    eyebrow: "تم الإرسال", title: "تفقّدي *بريدكِ*",
    subtitle: "إذا كان هناك حساب على نيدل بالبريد {email}، فالرابط في طريقه إليكِ. صالح لمدة ساعة.",
    tip: "لم يصلكِ شيء؟ تفقّدي الرسائل غير المرغوب فيها، أو أعيدي الإرسال.",
    resend: "إعادة الإرسال", resendIn: "إعادة الإرسال بعد {seconds}", other: "استخدمي بريداً آخر",
  },
  reset: {
    checking: "جارٍ التحقق من الرابط…",
    eyebrow: "كلمة سر جديدة", title: "اختاري كلمة سر *جديدة*", subtitle: "للحساب {email}",
    match: "كلمتا السر متطابقتان", noMatch: "كلمتا السر غير متطابقتين بعد", submit: "حفظ كلمة السر",
  },
  expired: {
    eyebrow: "كلمة سر جديدة", title: "انتهت صلاحية *الرابط*",
    subtitle: "رابط الاستعادة يعمل مرة واحدة ولمدة ساعة. اطلبي رابطاً جديداً وافتحي أحدث رسالة.",
    submit: "إرسال رابط جديد", back: "الرجوع لتسجيل الدخول",
  },
  done: {
    eyebrow: "تم", title: "تم تحديث *كلمة السر*", subtitle: "تم تسجيل دخولكِ بكلمة السر الجديدة.",
    shop: "متابعة التسوق", account: "حسابي",
  },
  errors: {
    required: "املئي هذا الحقل.",
    name: "اكتبي اسمكِ بالكامل.",
    invalidEmail: "اكتبي بريداً إلكترونياً مثل name@example.com.",
    phone: "رقم الموبايل المصري يبدأ بـ 10 أو 11 أو 12 أو 15 ويتكوّن من 10 أرقام.",
    weakPassword: "استخدمي ٨ أحرف على الأقل، فيها حرف ورقم.",
    invalidCredentials: "البريد الإلكتروني أو كلمة السر غير صحيحة. حاولي مرة أخرى، أو {link}.",
    resetLink: "غيّري كلمة السر",
    emailTaken: "يوجد حساب بهذا البريد الإلكتروني بالفعل.",
    signInInstead: "سجّلي الدخول بدلاً من ذلك",
    samePassword: "هذه كلمة السر الحالية. اختاري كلمة سر جديدة.",
    rateLimited: "محاولات كثيرة. انتظري دقيقة وحاولي مرة أخرى.",
    emailNotConfirmed: "أكّدي بريدكِ الإلكتروني أولاً. الرابط في صندوق الوارد.",
    signupDisabled: "إنشاء الحسابات متوقف حالياً. حاولي لاحقاً.",
    generic: "حدث خطأ. تأكدي من الاتصال وحاولي مرة أخرى.",
  },
  seo: {
    signIn: "تسجيل الدخول", signUp: "حساب جديد", forgot: "نسيتِ كلمة السر",
    reset: "كلمة سر جديدة", addPhone: "رقم الموبايل",
  },
},
```

Emails, phone numbers and the `{email}` placeholder are wrapped in `<bdi dir="ltr">` inside Arabic text.

---

## 10. Accessibility checklist

- One `<h1>` per screen (the `AuthHeader` title). Move focus to it when the screen changes inside
  a page (step 1 → 2, form → sent, form → welcome).
- Every input has a visible `<label>`; hints and errors linked with `aria-describedby`;
  `aria-invalid` on errors; focus the first invalid field on submit.
- Error banners use `role="alert"`; the password rules summary uses `aria-live="polite"`.
- Eye toggle: `aria-label` + `aria-pressed`.
- Focus ring visible on everything: fields use the 4px ring, buttons and links `outline-2 outline-offset-2`.
- Colour is never the only signal: errors and successes have icons and text.
- Contrast: `ink-muted` on ivory and `champagne` on burgundy both pass AA for body text.
- `prefers-reduced-motion`: no thread animation, slower spinner.
- Correct `autocomplete` on every field (listed per screen) so password managers and iOS fill them.

---

## 11. QA checklist

- Widths 360, 390, 430, then 768 and 1280, in Arabic and English. No horizontal scroll (watch long
  emails: they must scroll inside the field, not widen the page; give grid children `min-w-0`).
- Arabic: brand panel on the right on desktop, back arrow points right, email/password/phone stay LTR
  and right-aligned, `+20` stays on the left of the number.
- Phone field: type `01012345678`, `+20 10 1234 5678`, `00201012345678`, `٠١٠١٢٣٤٥٦٧٨`, paste with
  dashes. All show `10 1234 5678` and save `01012345678`. `16 1234 5678` shows the error.
- Sign-up step 2 → browser back returns to step 1 with the values kept.
- Sign-in, sign-up (Welcome → Start shopping) and Google all end on the home page.
- Google sign-up with no phone lands on Add mobile; skip doesn't ask again.
- Reset link opened in another browser (token_hash link) works; an old link shows Link expired.
- Forgot password with an unknown email still shows Email sent.
- GitHub Pages build (`next build` with the Pages config): all five pages are exported as static files.
- `/[locale]/design-system/` shows TextField (all states), PasswordField, PhoneField, PasswordRules,
  SegmentedTabs and the `shape="field"` buttons.

---

## 12. Build order

1. Tokens (2.1, 2.2).
2. `Button shape="field"`, `SegmentedTabs`.
3. Input system: `FieldMessage`, `TextField`, `PasswordField`, `PasswordRules`, `PhoneField`,
   plus examples on the design-system page.
4. `src/lib/auth/form.ts` + unit tests for `phoneDigits`, `formatPhone`, `passwordRules`, `safeNext`.
5. `AuthLayout` + `BrandPanel` and the small auth components.
6. i18n strings.
7. Pages in flow order: sign-in → sign-up (steps + welcome) → forgot → reset → account/complete.
8. QA pass (section 11).
