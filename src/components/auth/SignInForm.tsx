import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { PasswordField, TextField } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { authErrorReason, signIn, signInWithGoogle } from "@/lib/auth";
import { AUTH_STORAGE, readSession, writeSession } from "@/lib/auth/form";
import { signInSchema, type SignInValues } from "@/lib/auth/schemas";
import AuthHeader from "./AuthHeader";
import { AuthLink, ErrorBanner, GoogleButton, OrDivider, SubmitButton } from "./AuthParts";
import { useAuthNext } from "./useAuthPage";

// The "Sign in" tab of the sign-in page (AuthPage). Spec: docs/auth-flow-spec.md → 7.1.
// After signing in she goes to `?next=` (default /account/).

export const SIGN_IN_TITLE_ID = "auth-title-sign-in";

export default function SignInForm({ active }: { active: boolean }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { next, after } = useAuthNext();
  const [googleLoading, setGoogleLoading] = useState(false);
  // Wrong email or password: one banner explains it, both fields get the error look.
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const schema = useMemo(() => signInSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: yupResolver(schema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  // Email typed in the other tab or on another auth page, when this tab opens and hers is empty.
  useEffect(() => {
    if (!active || getValues("email")) return;
    const email = readSession(AUTH_STORAGE.email);
    if (email) setValue("email", email);
  }, [active, getValues, setValue]);

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
  );
}
