import Seo from "@/components/seo/Seo";
import { Button, Typography } from "@/components/ui";
import { useTranslation, type MessageKey } from "@/i18n/useTranslation";
import { BRAND } from "@/theme/brand";

// Privacy policy (/ar/privacy/, /en/privacy/). Static page.
// Google sign-in needs this page's address on the OAuth consent screen (Branding).
// All text is in messages → `privacy`; each section below names its title, intro and list keys.
// When you change what the site collects, update the text and `privacy.updatedDate`.

type Section = {
  id: string;
  /** Key under `privacy.<id>` of the paragraph under the title. */
  body?: string;
  /** Keys under `privacy.<id>` shown as a bulleted list. */
  items?: string[];
  /** Keys under `privacy.<id>` shown as paragraphs after the list. */
  after?: string[];
};

const SECTIONS: Section[] = [
  { id: "who", body: "body" },
  { id: "collect", body: "body", items: ["account", "phone", "addresses", "orders", "technical"] },
  { id: "google", body: "body", after: ["limitedUse"] },
  { id: "use", body: "body", items: ["account", "orders", "support", "security"], after: ["noSale"] },
  { id: "share", body: "body", items: ["supabase", "delivery", "hosting", "legal"] },
  { id: "storage", body: "body" },
  { id: "cookies", body: "body" },
  { id: "rights", body: "body" },
  { id: "children", body: "body" },
  { id: "changes", body: "body" },
  { id: "contact", body: "body" },
];

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const key = (id: string, name: string) => `privacy.${id}.${name}` as MessageKey;
  const email = BRAND.contactEmail;

  return (
    <>
      <Seo title={t("privacy.title")} description={t("privacy.description")} />

      <article className="mx-auto grid max-w-3xl gap-10 px-4 pt-8 pb-16 md:gap-12 md:px-8 md:pt-14 md:pb-24">
        <header className="grid gap-3">
          <Typography variant="eyebrow" color="muted">
            {t("seo.siteName")}
          </Typography>
          <Typography variant="h1" italic>
            {t("privacy.title")}
          </Typography>
          <Typography variant="bodySm" color="muted">
            {t("privacy.updated", { date: t("privacy.updatedDate") })}
          </Typography>
          <Typography className="mt-2">{t("privacy.intro")}</Typography>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`privacy-${section.id}`} className="grid gap-4">
            <Typography variant="h2" color="burgundy" id={`privacy-${section.id}`}>
              {t(key(section.id, "title"))}
            </Typography>
            {section.body && <Typography>{t(key(section.id, section.body))}</Typography>}
            {section.items && (
              <ul className="grid list-disc gap-2 ps-5 marker:text-burgundy">
                {section.items.map((item) => (
                  <Typography as="li" key={item}>
                    {t(key(section.id, item))}
                  </Typography>
                ))}
              </ul>
            )}
            {section.after?.map((item) => (
              <Typography key={item}>{t(key(section.id, item))}</Typography>
            ))}
            {section.id === "contact" &&
              (email.includes("@") ? (
                <Button variant="link" href={`mailto:${email}`} dir="ltr" className="justify-self-start">
                  {email}
                </Button>
              ) : (
                <Typography variant="subtitle" as="p" dir="ltr" className="justify-self-start">
                  {email}
                </Typography>
              ))}
          </section>
        ))}
      </article>
    </>
  );
}
