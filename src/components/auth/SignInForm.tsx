import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { PasswordField, TextField, setPendingToast, toast } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { authErrorReason, signIn, signInWithGoogle } from "@/lib/auth";
import { signInSchema, type SignInValues } from "@/lib/auth/schemas";
import AuthHeader from "./AuthHeader";
import { AuthLink, ErrorBanner, GoogleButton, OrDivider, SubmitButton } from "./AuthParts";
import { AFTER_AUTH_PATH } from "./useAuthPage";

// The "Sign in" tab of the sign-in page (AuthPage). Spec: docs/auth-flow-spec.md → 7.1.
// After signing in she goes to the home page.

export const SIGN_IN_TITLE_ID = "auth-title-sign-in";

export default function SignInForm() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [googleLoading, setGoogleLoading] = useState(false);
  // Wrong email or password: one banner explains it, both fields get the error look.
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const schema = useMemo(() => signInSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: yupResolver(schema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: SignInValues) {
    setWrongCredentials(false);
    try {
      const { firstName } = await signIn(values.email.trim(), values.password);
      toast.success({
        title: firstName ? t("auth.toast.signedIn.title", { name: firstName }) : t("auth.toast.signedIn.titleNoName"),
        message: t("auth.toast.signedIn.message"),
      });
      router.push(localePath(locale, AFTER_AUTH_PATH));
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
    setPendingToast("google"); // shown by AuthListener when Google sends her back
    try {
      await signInWithGoogle(locale);
    } catch {
      setGoogleLoading(false);
      setError("root", { message: t("auth.errors.generic") });
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="grid gap-[18px]">
      <AuthHeader titleId={SIGN_IN_TITLE_ID} eyebrow={t("auth.signIn.eyebrow")} title={t("auth.signIn.title")} subtitle={t("auth.signIn.subtitle")} />
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
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
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
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <PasswordField
            {...field}
            label={t("auth.fields.password")}
            autoComplete="current-password"
            enterKeyHint="go"
            invalid={wrongCredentials}
            error={fieldState.error?.message}
          />
        )}
      />
      <div className="-mt-2.5 flex justify-end">
        <AuthLink href={localePath(locale, "/forgot-password")}>{t("auth.signIn.forgot")}</AuthLink>
      </div>
      <SubmitButton loading={isSubmitting}>{t("auth.signIn.submit")}</SubmitButton>
    </form>
  );
}
