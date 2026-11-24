import Link from "next/link";
import { useRouter } from "next/router";
import Button from "@mui/material/Button";
import { useTranslation } from "@/i18n/useTranslation";

// Switches between Arabic and English, keeping the current page.
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { asPath } = useRouter();
  const { t, locale } = useTranslation();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Button
      component={Link}
      href={asPath}
      locale={nextLocale}
      variant="text"
      size="small"
      className={className}
    >
      {t("common.language")}
    </Button>
  );
}
