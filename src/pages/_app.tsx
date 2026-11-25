import { useEffect, useMemo } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Cormorant_Garamond, IBM_Plex_Sans_Arabic, Jost, Markazi_Text } from "next/font/google";
import type { EmotionCache } from "@emotion/react";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";
import Layout from "@/components/layout/Layout";
import StoreProvider from "@/store/StoreProvider";
import createAppTheme from "@/theme/theme";
import createEmotionCache from "@/lib/emotion/createEmotionCache";
import { getDirection } from "@/i18n/config";
import { useLocale } from "@/i18n/useLocale";
import { assetPath } from "@/lib/assetPath";
import { BRAND, COLORS } from "@/theme/brand";
import "@/styles/globals.css";

// Brand fonts (see src/theme/brand.ts): display + body for Latin and Arabic.
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"] });
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"] });
// Arabic: Markazi Text (editorial Naskh serif, no italic) + IBM Plex Sans Arabic.
const markazi = Markazi_Text({ subsets: ["arabic", "latin"], weight: ["400", "500", "600"] });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["300", "400", "500", "600"] });

// One client-side Emotion cache per direction (created once, reused on navigation).
const clientCaches = {
  ltr: createEmotionCache("ltr"),
  rtl: createEmotionCache("rtl"),
};

type MyAppProps = AppProps & { emotionCache?: EmotionCache };

export default function MyApp({ Component, pageProps, emotionCache }: MyAppProps) {
  const locale = useLocale();
  const dir = getDirection(locale);
  const theme = useMemo(() => createAppTheme(dir), [dir]);

  // _document only runs on the server; keep <html> in sync on client-side locale switches.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return (
    <AppCacheProvider emotionCache={emotionCache ?? clientCaches[dir]}>
      {/*
        CSS layer order is fixed by where each layer first appears. MUI's styles are injected
        at the top of <head>, before Tailwind's stylesheet, so declare the order (same as
        globals.css) as the very first Emotion style, or `mui` would rank below Tailwind's preflight.
      */}
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        {/* Site-wide: icons and app info (made by scripts/generate-brand-assets.mjs).
            Per-page title, description and share tags come from <Seo /> in each page. */}
        <link rel="icon" href={assetPath("/favicon.ico")} sizes="48x48" />
        <link rel="icon" type="image/png" sizes="32x32" href={assetPath("/icons/favicon-32.png")} />
        <link rel="icon" type="image/png" sizes="16x16" href={assetPath("/icons/favicon-16.png")} />
        <link rel="apple-touch-icon" sizes="180x180" href={assetPath("/icons/apple-touch-icon.png")} />
        <link rel="manifest" href={assetPath("/site.webmanifest")} />
        <meta name="theme-color" content={COLORS.burgundy} />
        <meta name="application-name" content={BRAND.name} />
        <meta name="apple-mobile-web-app-title" content={BRAND.name} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      {/* Expose fonts as CSS variables on :root so portals (dialogs, menus) get them too */}
      <style jsx global>{`
        :root {
          --nd-font-display: ${cormorant.style.fontFamily};
          --nd-font-sans: ${jost.style.fontFamily};
          --nd-font-ar-display: ${markazi.style.fontFamily};
          --nd-font-ar-sans: ${plexArabic.style.fontFamily};
        }
      `}</style>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StoreProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </StoreProvider>
      </ThemeProvider>
    </AppCacheProvider>
  );
}
