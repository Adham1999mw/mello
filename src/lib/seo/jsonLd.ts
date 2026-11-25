import { BRAND } from "@/theme/brand";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/i18n/static";
import { absoluteUrl } from "./site";

/** schema.org Organization (the brand) + WebSite, for the home page. */
export function homeJsonLd(locale: Locale, description: string) {
  const home = absoluteUrl(localePath(locale, "/"));
  return [
    {
      "@context": "https://schema.org",
      "@type": "ClothingStore",
      "@id": `${absoluteUrl("/")}#organization`,
      name: BRAND.name,
      description,
      url: home,
      logo: absoluteUrl("/icons/icon-512.png"),
      image: absoluteUrl("/og/needle-og.jpg"),
      address: { "@type": "PostalAddress", addressCountry: "EG" },
      currenciesAccepted: "EGP",
      paymentAccepted: "Cash",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BRAND.name,
      url: home,
      inLanguage: locale,
      publisher: { "@id": `${absoluteUrl("/")}#organization` },
    },
  ];
}
