import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import Seo from "@/components/seo/Seo";
import { PasswordField, TextField } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { authErrorReason, signIn, signInWithGoogle } from "@/lib/auth";
import { AUTH_STORAGE, readSession, writeSession } from "@/lib/auth/form";
import { signInSchema, type SignInValues } from "@/lib/auth/schemas";
import AuthHeader from "./AuthHeader";
import AuthLayout from "./AuthLayout";
import { AuthLink, AuthTabs, ErrorBanner, GoogleButton, OrDivider, SubmitButton } from "./AuthParts";
import { AUTH_TITLE_ID, useAuthNext, useRedirectIfSignedIn } from "./useAuthPage";

// Sign in (/ar/sign-in/, /en/sign-in/). Static page, so it works on GitHub Pages too.
// Spec: docs/auth-flow-spec.md → 7.1. After signing in she goes to `?next=` (default /account/).

export default function SignInPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { next, after } = useAuthNext();
  const [googleLoading, setGoogleLoading] = useState(false);
  // Wrong email or password: one banner explains it, both fields get the error look.
  const [wrongCredentials, setWrongCredentials] = useState(false);
  useRedirectIfSignedIn(after);
  const schema = useMemo(() => signInSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: yupResolver(schema), mode: "onTouched", defaultValues: { email: "", password: "" } });

  // Email typed on another auth page.
  useEffect(() => {
    const email = readSession(AUTH_STORAGE.email);
    if (email) setValue("email", email);
  }, [setValue]);

  async function submit(values: SignInValues) {
    setWrongCredentials(false);
    try {
      await signIn(values.email.trim(), values.password);
      router.replace(after);
    } catch (error) {
      const reason = authErrorReason(error);
      if (reason === "invalidCredentials") {
        setWrongCredentials(true);
        setValue("password", "");
        setFocus("password");
      } else if (reason === "emailNotConfirmed") setError("root", { message: t("auth.errors.emailNotConfirmed") });
      else if (reason === "rateLimited") setError("root", { message: t("auth.errors.rateLimited") });
      else if (reason === "invalidEmail") setError("email", { message: t("auth.errors.invalidEmail") }, { shouldFocus: true });
      else setError("root", { message: t("auth.errors.generic") });
    }
  }

  async function continueWithGoogle() {
    setGoogleLoading(true);
    writeSession(AUTH_STORAGE.next, next);
    try {
      await signInWithGoogle(locale);
    } catch {
      setGoogleLoading(false);
      setError("root", { message: t("auth.errors.generic") });
    }
  }

  const clearWrong = () => wrongCredentials && setWrongCredentials(false);

  return (
    <>
      <Seo title={t("auth.seo.signIn")} noindex />
      <AuthLayout closeHref={localePath(locale, next ?? "/")}>
        <form noValidate onSubmit={handleSubmit(submit)} className="grid gap-[18px]">
          <AuthTabs current="signIn" />
          <AuthHeader titleId={AUTH_TITLE_ID} eyebrow={t("auth.signIn.eyebrow")} title={t("auth.signIn.title")} subtitle={t("auth.signIn.subtitle")} />
          {wrongCredentials && (
            <ErrorBanner>
              {t("auth.errors.invalidCredentials")}
              <Link href={localePath(locale, "/forgot-password")} className="font-medium underline underline-offset-4">
                {t("auth.errors.resetLink")}
              </Link>
              .
            </ErrorBanner>
          )}
          {errors.root?.message && <ErrorBanner>{errors.root.message}</ErrorBanner>}
          <GoogleButton onClick={continueWithGoogle} loading={googleLoading} />
          <OrDivider />
          <TextField
            label={t("auth.fields.email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t("auth.fields.emailPlaceholder")}
            enterKeyHint="next"
            ltr
            invalid={wrongCredentials}
            error={errors.email?.message}
            {...register("email", {
              onChange: (e) => {
                clearWrong();
                writeSession(AUTH_STORAGE.email, e.target.value);
              },
            })}
          />
          <PasswordField
            label={t("auth.fields.password")}
            autoComplete="current-password"
            enterKeyHint="go"
            invalid={wrongCredentials}
            error={errors.password?.message}
            {...register("password", {
              onChange: clearWrong,
            })}
          />
          <div className="-mt-2.5 flex justify-end">
            <AuthLink href={localePath(locale, "/forgot-password")}>{t("auth.signIn.forgot")}</AuthLink>
          </div>
          <SubmitButton loading={isSubmitting}>{t("auth.signIn.submit")}</SubmitButton>
        </form>
      </AuthLayout>
    </>
  );
}

