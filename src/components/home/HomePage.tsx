import Seo from "@/components/seo/Seo";
import { useTranslation } from "@/i18n/useTranslation";
import { homeJsonLd } from "@/lib/seo/jsonLd";
import HeroSection from "./HeroSection";
import LookbookSection from "./LookbookSection";
import NewArrivalsSection from "./NewArrivalsSection";

// The home page. Rendered by `/` (Arabic) and `/[locale]/` (`/ar/`, `/en/`).
export default function HomePage() {
  const { t, locale } = useTranslation();

  return (
    <>
      <Seo jsonLd={homeJsonLd(locale, t("seo.description"))} />
      <HeroSection />
      <LookbookSection />
      <NewArrivalsSection />
    </>
  );
}
