import { useEffect, useMemo } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import type { EmotionCache } from "@emotion/react";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";
import StoreProvider from "@/store/StoreProvider";
import createAppTheme from "@/theme/theme";
import createEmotionCache from "@/lib/emotion/createEmotionCache";
import { getDirection, toLocale } from "@/i18n/config";
import "@/styles/globals.css";

const geistSans = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });
const cairo = Cairo({ subsets: ["arabic", "latin"] });

// One client-side Emotion cache per direction (created once, reused on navigation).
const clientCaches = {
  ltr: createEmotionCache("ltr"),
  rtl: createEmotionCache("rtl"),
};

type MyAppProps = AppProps & { emotionCache?: EmotionCache };

export default function MyApp({ Component, pageProps, router, emotionCache }: MyAppProps) {
  const locale = toLocale(router.locale);
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
          --font-geist-sans: ${geistSans.style.fontFamily};
          --font-geist-mono: ${geistMono.style.fontFamily};
          --font-arabic: ${cairo.style.fontFamily};
        }
      `}</style>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StoreProvider>
          <Component {...pageProps} />
        </StoreProvider>
      </ThemeProvider>
    </AppCacheProvider>
  );
}
