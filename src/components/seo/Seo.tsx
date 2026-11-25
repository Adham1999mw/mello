import Head from "next/head";
import { useTranslation } from "@/i18n/useTranslation";
import { locales } from "@/i18n/config";
import { DEFAULT_OG_IMAGE, OG_LOCALES, absoluteUrl } from "@/lib/seo/site";

type SeoProps = {
  /** Page name, shown as "{title} | Needle". Leave out on the home page. */
  title?: string;
  /** About 150 characters. Defaults to the brand description. */
  description?: string;
  /** Share image: a site path ("/og/x.jpg") or a full URL (product photo). */
  image?: { url: string; width?: number; height?: number; alt?: string };
  /** "product" for product pages; "website" otherwise. */
  type?: "website" | "product" | "article";
  /** Keep the page out of search results (admin, cart, checkout...). */
  noindex?: boolean;
  /** Structured data (schema.org JSON-LD) objects for this page. */
  jsonLd?: object[];
};

/**
 * Title, description, Open Graph and Twitter tags for a page.
 * Put one in every page. Site-wide tags (icons, manifest, theme color) are in _app.tsx.
 */
export default function Seo({ title, description, image, type = "website", noindex, jsonLd }: SeoProps) {
  const { t, locale } = useTranslation();

  const siteName = t("seo.siteName");
  const fullTitle = title ? t("seo.titleTemplate", { title }) : t("seo.homeTitle");
  const desc = description ?? t("seo.description");

  const img = image ?? { url: DEFAULT_OG_IMAGE.path, ...DEFAULT_OG_IMAGE, alt: t("seo.imageAlt") };
  const imgUrl = /^https?:\/\//.test(img.url) ? img.url : absoluteUrl(img.url);
  const imgAlt = img.alt ?? fullTitle;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} key="description" />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}
        key="robots"
      />

      <meta property="og:site_name" content={siteName} key="og:site_name" />
      <meta property="og:type" content={type} key="og:type" />
      <meta property="og:title" content={fullTitle} key="og:title" />
      <meta property="og:description" content={desc} key="og:description" />
      <meta property="og:locale" content={OG_LOCALES[locale]} key="og:locale" />
      {locales
        .filter((l) => l !== locale)
        .map((l) => (
          <meta property="og:locale:alternate" content={OG_LOCALES[l]} key={`og:locale:${l}`} />
        ))}
      <meta property="og:image" content={imgUrl} key="og:image" />
      <meta property="og:image:secure_url" content={imgUrl} key="og:image:secure_url" />
      {img.width && <meta property="og:image:width" content={String(img.width)} key="og:image:width" />}
      {img.height && <meta property="og:image:height" content={String(img.height)} key="og:image:height" />}
      <meta property="og:image:alt" content={imgAlt} key="og:image:alt" />

      <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta name="twitter:title" content={fullTitle} key="twitter:title" />
      <meta name="twitter:description" content={desc} key="twitter:description" />
      <meta name="twitter:image" content={imgUrl} key="twitter:image" />
      <meta name="twitter:image:alt" content={imgAlt} key="twitter:image:alt" />

      {jsonLd?.map((data, i) => (
        <script
          type="application/ld+json"
          key={`jsonld-${i}`}
          // `<` escaped so text in the data can't close the script tag
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
      ))}
    </Head>
  );
}
