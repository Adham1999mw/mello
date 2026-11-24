import Link from "next/link";
import { useRouter } from "next/router";
import Button from "@mui/material/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { localePath, stripLocale } from "@/i18n/static";

// Switches between Arabic and English, keeping the current page.
export default function LanguageSwitcher() {
  const { asPath } = useRouter();
  const { t, locale } = useTranslation();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Button
      component={Link}
      href={localePath(nextLocale, stripLocale(asPath))}
      variant="text"
      size="small"
    >
      {t("common.language")}
    </Button>
  );
}
