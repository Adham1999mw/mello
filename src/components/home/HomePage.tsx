import Head from "next/head";
import BackgroundSection from "@/components/home/BackgroundSection";
import HeroSection from "@/components/home/HeroSection";
import { useTranslation } from "@/i18n/useTranslation";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{t("common.brand")}</title>
      </Head>
      <HeroSection />
      <BackgroundSection />
    </>
  );
}
