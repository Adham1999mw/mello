import { useEffect, useMemo } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Alexandria, Cormorant_Garamond, Jost, Noto_Kufi_Arabic } from "next/font/google";
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
import "@/styles/globals.css";

// Brand fonts (see src/theme/brand.ts): display + body for Latin and Arabic.
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"] });
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"] });
// Arabic: a thin Kufi for headings (matches the fine lines of the logo and Cormorant)
// and a geometric sans for text (the Arabic partner of Jost).
const notoKufi = Noto_Kufi_Arabic({ subsets: ["arabic"], weight: ["200", "300", "400"] });
const alexandria = Alexandria({ subsets: ["arabic"], weight: ["300", "400", "500"] });

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
      </Head>
      {/* Expose fonts as CSS variables on :root so portals (dialogs, menus) get them too */}
      <style jsx global>{`
        :root {
          --nd-font-display: ${cormorant.style.fontFamily};
          --nd-font-sans: ${jost.style.fontFamily};
          --nd-font-ar-display: ${notoKufi.style.fontFamily};
          --nd-font-ar-sans: ${alexandria.style.fontFamily};
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
