import Link from "next/link";
import { Typography, typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";

// Site footer on every page (see Layout.tsx). Deep burgundy with champagne text.
// Phones: one centered column, with room at the bottom so the tab bar (BottomNav) never
// covers it. From `md` up: brand on the start side, links on the end side.
export default function Footer() {
  const { t, locale } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-burgundy-deep px-4 pt-10 pb-[calc(2.5rem+76px)] text-champagne md:px-14 md:py-10">
      <div className="mx-auto grid max-w-6xl justify-items-center gap-6 text-center md:grid-flow-col md:items-center md:justify-between md:text-start">
        <div className="grid gap-2 md:justify-items-start">
          <Typography variant="h3" as="p" italic>
            {t("seo.siteName")}
          </Typography>
          <Typography variant="bodySm" className="opacity-80">
            {t("footer.tagline")}
          </Typography>
        </div>

        <div className="grid justify-items-center gap-2 md:justify-items-end">
          <nav aria-label={t("footer.privacy")}>
            <Link
              href={localePath(locale, "/privacy")}
              className={`${typography("label")} inline-flex min-h-11 items-center hover:underline`}
            >
              {t("footer.privacy")}
            </Link>
          </nav>
          <Typography variant="caption" className="opacity-70">
            {t("footer.rights", { year })}
          </Typography>
        </div>
      </div>
    </footer>
  );
}
