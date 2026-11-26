import { useState } from "react";
import Head from "next/head";
import {
  Button,
  DiscountBadge,
  IconButton,
  PasswordField,
  PasswordRules,
  PhoneField,
  SegmentedTabs,
  TextField,
  Typography,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
  type TypographyVariant,
} from "@/components/ui";
import { formatPrice } from "@/components/product/formatPrice";
import { useTranslation } from "@/i18n/useTranslation";

// Live reference of the design system (src/components/ui): every button and text style,
// in the current language. Open /ar/design-system/ and /en/design-system/ to compare.
// Kept out of search results. Static page, so it works on GitHub Pages too.

const VARIANTS: ButtonVariant[] = ["solid", "outline", "text", "link"];
const LIGHT_TONES: ButtonTone[] = ["burgundy", "ink", "danger"];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];
const TYPE_SCALE: TypographyVariant[] = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "subtitle",
  "eyebrow",
  "label",
  "button",
  "note",
  "body",
  "bodySm",
  "caption",
  "price",
  "priceSm",
];

export default function DesignSystemPage() {
  const { t, locale } = useTranslation();
  const sample = t("designSystem.sample");

  return (
    <>
      <Head>
        <title>{`${t("designSystem.title")} · ${t("common.brand")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="mx-auto grid max-w-5xl gap-14 px-4 pt-8 pb-16 md:px-14 md:pt-14">
        <header className="grid gap-3">
          <Typography variant="eyebrow" color="muted">
            {t("common.brand")}
          </Typography>
          <Typography variant="h1" italic>
            {t("designSystem.title")}
          </Typography>
          <Typography color="muted" className="max-w-prose">
            {t("designSystem.intro")}
          </Typography>
        </header>

        {/* Buttons */}
        <section className="grid gap-8">
          <Typography variant="h2" color="burgundy">
            {t("designSystem.buttons")}
          </Typography>

          <Group title={t("designSystem.onLight")}>
            {LIGHT_TONES.map((tone) => (
              <Row key={tone} name={`tone="${tone}"`}>
                {VARIANTS.map((variant) => (
                  <Button key={variant} variant={variant} tone={tone}>
                    {variant}
                  </Button>
                ))}
              </Row>
            ))}
          </Group>

          <Group title={t("designSystem.onDark")}>
            <div className="hero-bg relative isolate overflow-hidden rounded-brand p-4 text-champagne md:p-6">
              <Row name={`tone="champagne"`} dark>
                {VARIANTS.map((variant) => (
                  <Button key={variant} variant={variant} tone="champagne">
                    {variant}
                  </Button>
                ))}
              </Row>
            </div>
          </Group>

          <Group title={t("designSystem.sizes")}>
            <Row name={`size=...`}>
              {SIZES.map((size) => (
                <Button key={size} size={size}>
                  {size}
                </Button>
              ))}
            </Row>
            <Row name={`fullWidth="mobile"`}>
              <Button fullWidth="mobile">{sample}</Button>
            </Row>
          </Group>

          <Group title={t("designSystem.states")}>
            <Row name="disabled · startIcon · endIcon">
              <Button disabled>{t("designSystem.disabled")}</Button>
              <Button variant="outline" startIcon={<BagIcon />}>
                {sample}
              </Button>
              <Button variant="text" tone="ink" endIcon={<ArrowIcon />}>
                {t("home.products.viewAll")}
              </Button>
            </Row>
          </Group>

          <Group title={t("designSystem.iconButtons")}>
            <Row name={`variant="plain" · "outline"`}>
              {(["ink", "burgundy", "danger"] as const).map((tone) => (
                <IconButton key={tone} label={sample} tone={tone}>
                  <BagIcon />
                </IconButton>
              ))}
              {(["ink", "burgundy"] as const).map((tone) => (
                <IconButton key={tone} label={t("home.lookbook.next")} variant="outline" tone={tone}>
                  <ArrowIcon />
                </IconButton>
              ))}
              <IconButton label={t("designSystem.disabled")} tone="ink" disabled>
                <BagIcon />
              </IconButton>
            </Row>
          </Group>

          <Group title={t("designSystem.badges")}>
            <Row name="DiscountBadge percent={...}">
              {[10, 20, 35].map((percent) => (
                <DiscountBadge key={percent} percent={percent} />
              ))}
            </Row>
          </Group>
        </section>

        {/* Form fields */}
        <section className="grid gap-8">
          <Typography variant="h2" color="burgundy">
            {t("designSystem.fields")}
          </Typography>
          <Typography color="muted" className="max-w-prose">
            {t("designSystem.fieldsIntro")}
          </Typography>

          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            <Row name="TextField">
              <TextField className="w-full" label={t("auth.fields.name")} placeholder={t("auth.fields.name")} />
            </Row>
            <Row name="TextField valid">
              <TextField className="w-full" label={t("auth.fields.name")} defaultValue="Sara Ahmed" valid />
            </Row>
            <Row name="TextField error">
              <TextField className="w-full" label={t("auth.fields.email")} type="email" ltr defaultValue="sara@" error={t("auth.errors.invalidEmail")} />
            </Row>
            <Row name="TextField optional hint">
              <TextField className="w-full" label={t("auth.fields.email")} type="email" ltr optional hint={t("auth.fields.phoneHint")} />
            </Row>
            <Row name="TextField disabled">
              <TextField className="w-full" label={t("auth.fields.email")} ltr defaultValue="sara@example.com" disabled />
            </Row>
            <Row name="TextField readOnly">
              <TextField className="w-full" label={t("auth.fields.email")} ltr defaultValue="sara@example.com" readOnly />
            </Row>
            <Row name="PhoneField (+20)">
              <PhoneDemo label={t("auth.fields.phone")} hint={t("auth.fields.phoneHint")} />
            </Row>
            <Row name="PasswordField + PasswordRules">
              <PasswordDemo label={t("auth.fields.password")} />
            </Row>
          </div>

          <Group title={t("designSystem.fieldButtons")}>
            <Row name={`shape="field" fullWidth`}>
              <div className="grid w-full max-w-[400px] gap-2.5">
                <Button shape="field" fullWidth>
                  {t("auth.signUp.continue")}
                </Button>
                <Button shape="field" variant="outline" fullWidth>
                  {t("auth.welcome.account")}
                </Button>
              </div>
            </Row>
            <Row name="SegmentedTabs">
              <TabsDemo label={t("auth.tabsLabel")} labels={[t("auth.tabs.signIn"), t("auth.tabs.signUp")]} />
            </Row>
          </Group>
        </section>

        {/* Typography */}
        <section className="grid gap-6">
          <Typography variant="h2" color="burgundy">
            {t("designSystem.typography")}
          </Typography>
          <ul className="grid gap-6">
            {TYPE_SCALE.map((variant) => (
              <li key={variant} className="grid gap-2 border-t border-ink/10 pt-4 md:grid-cols-[9rem_1fr] md:gap-6">
                <code dir="ltr" className="text-start text-xs text-ink-muted">
                  {variant}
                </code>
                <Typography variant={variant} as="p" className="min-w-0 break-words">
                  {variant.startsWith("price") ? formatPrice(1250, locale) : t("designSystem.sampleText")}
                </Typography>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4">
      <Typography variant="subtitle">{title}</Typography>
      {children}
    </div>
  );
}

// One line of examples with its prop name. Phones: the examples wrap under each other.
function Row({ name, dark = false, children }: { name: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <code dir="ltr" className={`text-start text-xs ${dark ? "text-champagne/70" : "text-ink-muted"}`}>
        {name}
      </code>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function TabsDemo({ label, labels }: { label: string; labels: [string, string] }) {
  const [current, setCurrent] = useState(0);
  return (
    <SegmentedTabs
      className="w-full max-w-[400px]"
      label={label}
      items={labels.map((text, i) => ({ label: text, current: current === i, onSelect: () => setCurrent(i), id: `ds-tab-${i}` }))}
    />
  );
}

function PhoneDemo({ label, hint }: { label: string; hint: string }) {
  const [digits, setDigits] = useState("1012345678");
  return <PhoneField className="w-full" label={label} hint={hint} value={digits} onChange={setDigits} />;
}

function PasswordDemo({ label }: { label: string }) {
  const [value, setValue] = useState("Needle20");
  return (
    <div className="grid w-full gap-2">
      <PasswordField label={label} autoComplete="new-password" value={value} onChange={(e) => setValue(e.target.value)} />
      <PasswordRules value={value} />
    </div>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M5.5 8.5h13l-1 12h-11z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </svg>
  );
}

// Points forward: right in English, left in Arabic.
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.5] rtl:-scale-x-100">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { getStaticPaths, getStaticProps } from "@/i18n/static";
