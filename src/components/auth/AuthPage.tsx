import { useState } from "react";
import { useRouter } from "next/router";
import Seo from "@/components/seo/Seo";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import AuthLayout from "./AuthLayout";
import { AUTH_TAB_IDS, AuthTabs } from "./AuthParts";
import SignInForm from "./SignInForm";
import SignUpForm, { type SignUpStage } from "./SignUpForm";
import { authHref, type AuthTab } from "./useAuthPage";

// Sign in and create account, one page (/ar/sign-in/, /en/sign-in/). Static, so it works on
// GitHub Pages too. Spec: docs/auth-flow-spec.md → 7.0.
//
//   /sign-in/                     "Sign in" tab
//   /sign-in/?tab=sign-up         "Create account" tab
//
// The tab lives in the URL (shallow replace, so switching tabs adds no history entry and a shared
// link opens the right tab). Both forms stay mounted and the hidden one keeps what she typed.

export default function AuthPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const tab: AuthTab = router.query.tab === "sign-up" ? "signUp" : "signIn";
  // Once the account exists and needs confirming, the "check your email" screen replaces the tabs.
  const [signUpStage, setSignUpStage] = useState<SignUpStage>("form");

  console.log("AuthPage render", { tab, signUpStage, query: router.query });

  const signedUp = signUpStage !== "form";

  const selectTab = (target: AuthTab) => {
    if (target === tab) return;
    router.replace(authHref(locale, { tab: target }), undefined, { shallow: true });
  };

  // "Sign in instead": the button she pressed disappears, so put focus on the Sign in tab.
  const switchToSignIn = () => {
    selectTab("signIn");
    requestAnimationFrame(() => document.getElementById(AUTH_TAB_IDS.signIn.tab)?.focus());
  };

  const panel = (id: AuthTab) => ({
    role: "tabpanel",
    id: AUTH_TAB_IDS[id].panel,
    "aria-labelledby": AUTH_TAB_IDS[id].tab,
    hidden: tab !== id,
  });

  return (
    <>
      <Seo title={t(tab === "signUp" ? "auth.seo.signUp" : "auth.seo.signIn")} noindex />
      <AuthLayout closeHref={localePath(locale, "/")}>
        <div className="grid gap-[18px]">
          {!signedUp && <AuthTabs current={tab} onSelect={selectTab} />}
          {!signedUp && (
            <div {...panel("signIn")}>
              <SignInForm />
            </div>
          )}
          <div {...(signedUp ? {} : panel("signUp"))}>
            <SignUpForm onSwitchToSignIn={switchToSignIn} onStageChange={setSignUpStage} />
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
