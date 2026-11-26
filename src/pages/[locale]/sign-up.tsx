import { useEffect } from "react";
import { useRouter } from "next/router";
import Seo from "@/components/seo/Seo";
import { authHref } from "@/components/auth/useAuthPage";
import { useTranslation } from "@/i18n/useTranslation";
import { safeNext } from "@/lib/auth/form";

// Old address. Sign up is now the "Create account" tab of /sign-in/, so this page only sends
// her there (keeping ?next= and ?step=). Kept so old links and bookmarks still work.
export default function SignUpRedirect() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  useEffect(() => {
    if (!router.isReady) return;
    const step = router.query.step === "2" ? 2 : 1;
    router.replace(authHref(locale, { tab: "signUp", step, next: safeNext(router.query.next) }));
  }, [router, locale]);
  return <Seo title={t("auth.seo.signUp")} noindex />;
}

export { getStaticPaths, getStaticProps } from "@/i18n/static";
