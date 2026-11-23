import Head from "next/head";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/i18n/useTranslation";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t("common.brand")}</title>
      </Head>
      <header className="flex justify-end px-6 py-4">
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24 text-center">
        <Typography variant="h2" component="h1" className="font-bold tracking-tight">
          {t("home.title")}
        </Typography>
        <Typography variant="body1" className="max-w-md text-foreground/70">
          {t("home.tagline")}
        </Typography>
        {/* MUI component styled further with Tailwind utilities */}
        <Button variant="contained" size="large" className="rounded-full px-8">
          {t("home.shopNow")}
        </Button>
      </main>
    </>
  );
}
