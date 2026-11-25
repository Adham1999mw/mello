import Head from "next/head";
import { useTranslation } from "@/i18n/useTranslation";
import HeroSection from "./HeroSection";
import NewArrivalsSection from "./NewArrivalsSection";

// The home page. Rendered by `/` (Arabic) and `/[locale]/` (`/ar/`, `/en/`).
export default function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t("common.brand")}</title>
      </Head>
      <HeroSection />
      <NewArrivalsSection />
    </>
  );
}
