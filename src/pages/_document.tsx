import {
  DocumentHeadTags,
  documentGetInitialProps,
  type DocumentHeadTagsProps,
} from "@mui/material-nextjs/v16-pagesRouter";
import { Html, Head, Main, NextScript, type DocumentContext } from "next/document";
import { getDirection, toLocale } from "@/i18n/config";
import createEmotionCache from "@/lib/emotion/createEmotionCache";

type Props = DocumentHeadTagsProps & { locale: string; dir: "rtl" | "ltr" };

export default function Document(props: Props) {
  return (
    // `dir` drives Tailwind's `rtl:` / `ltr:` variants and logical utilities (ms-, ps-, start-...)
    <Html lang={props.locale} dir={props.dir}>
      <Head>
        {/* Injects MUI's server-rendered (Emotion) styles */}
        <DocumentHeadTags {...props} />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext) => {
  // The `[locale]` route segment; pages outside it (like `/`) are Arabic.
  const locale = toLocale(typeof ctx.query.locale === "string" ? ctx.query.locale : undefined);
  const dir = getDirection(locale);
  const initialProps = await documentGetInitialProps(ctx, {
    // Must match the client cache chosen in _app.tsx for this locale
    emotionCache: createEmotionCache(dir),
  });
  return { ...initialProps, locale, dir };
};
