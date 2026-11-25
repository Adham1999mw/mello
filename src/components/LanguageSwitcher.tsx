import { useRouter } from "next/router";
import { Button, type ButtonTone } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localePath, stripLocale } from "@/i18n/static";

// Switches between Arabic and English, keeping the current page.
// `tone="champagne"` on burgundy backgrounds, the default `ink` on light ones.
export default function LanguageSwitcher({ tone = "ink" }: { tone?: ButtonTone }) {
  const { asPath } = useRouter();
  const { t, locale } = useTranslation();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Button href={localePath(nextLocale, stripLocale(asPath))} variant="text" tone={tone} size="sm">
      {t("common.language")}
    </Button>
  );
}
