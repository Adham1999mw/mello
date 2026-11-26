import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button, PasswordField, PasswordRules, PhoneField, TextField, Typography, setPendingToast, toast } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { authErrorReason, firstName, signInWithGoogle, signUp } from "@/lib/auth";
import { toLocalPhone } from "@/lib/auth/form";
import { signUpSchema, type SignUpValues } from "@/lib/auth/schemas";
import AuthHeader from "./AuthHeader";
import { MailIcon } from "./AuthIcons";
import { AFTER_AUTH_PATH } from "./useAuthPage";
import { ErrorBanner, GoogleButton, OrDivider, StatusBadge, SubmitButton } from "./AuthParts";

// The "Create account" tab of the sign-in page (AuthPage). Spec: docs/auth-flow-spec.md → 7.2.
//
// One form: full name, mobile (+20), email, password. On success she goes to the home page,
// or sees "confirm your email" if Supabase's "Confirm email" is turned on later.

export type SignUpStage = "form" | "confirm";

export const SIGN_UP_TITLE_ID = "auth-title-sign-up";

type SignUpFormProps = {
  /** "Sign in instead" (the email already has an account): switch to the sign-in tab. */
  onSwitchToSignIn: () => void;
  /** Tells the page when the "check your email" screen shows, so it can hide the tabs. */
  onStageChange?: (stage: SignUpStage) => void;
};

export default function SignUpForm({ onSwitchToSignIn, onStageChange }: SignUpFormProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [stage, setStageState] = useState<SignUpStage>("form");
  const setStage = (value: SignUpStage) => {
    setStageState(value);
    onStageChange?.(value);
  };
  const [googleLoading, setGoogleLoading] = useState(false);
  const schema = useMemo(() => signUpSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: yupResolver(schema),
    // Check a field when she leaves it, then on every change once it has an error.
    mode: "onTouched",
    defaultValues: { fullName: "", phone: "", email: "", password: "" },
  });
  const [fullName = "", password = ""] = useWatch({ control, name: ["fullName", "password"] });

  async function createAccount(values: SignUpValues) {
    try {
      const { signedIn } = await signUp(locale, {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: toLocalPhone(values.phone),
      });
      // Signed in right away: go to the home page. With "Confirm email" on, show "check your email".
      if (signedIn) {
        const name = firstName(values.fullName);
        toast.success({
          title: name ? t("auth.toast.signedUp.title", { name }) : t("auth.toast.signedUp.titleNoName"),
          message: t("auth.toast.signedUp.message"),
        });
        router.push(localePath(locale, AFTER_AUTH_PATH));
      } else {
        toast.success({ title: t("auth.toast.confirmSent.title"), message: t("auth.toast.confirmSent.message") });
        setStage("confirm");
      }
    } catch (error) {
      const reason = authErrorReason(error);
      if (reason === "emailTaken") setError("email", { type: "taken", message: t("auth.errors.emailTaken") }, { shouldFocus: true });
      else if (reason === "invalidEmail") setError("email", { type: "server", message: t("auth.errors.invalidEmail") }, { shouldFocus: true });
      else if (reason === "invalidPhone") setError("phone", { type: "server", message: t("auth.errors.phone") }, { shouldFocus: true });
      else if (reason === "weakPassword") setError("password", { type: "server", message: t("auth.errors.weakPassword") }, { shouldFocus: true });
      else if (reason === "rateLimited") setError("root", { message: t("auth.errors.rateLimited") });
      else if (reason === "signupDisabled") setError("root", { message: t("auth.errors.signupDisabled") });
      else setError("root", { message: t("auth.errors.generic") });
    }
  }

  async function continueWithGoogle() {
    setGoogleLoading(true);
    setPendingToast("google"); // shown by AuthListener when Google sends her back
    try {
      await signInWithGoogle(locale); // leaves the page
    } catch {
      setGoogleLoading(false);
      setError("root", { message: t("auth.errors.generic") });
    }
  }

  if (stage === "confirm") {
    return (
      <div className="grid gap-[18px]">
        <StatusBadge>
          <MailIcon />
        </StatusBadge>
        <AuthHeader
          titleId={SIGN_UP_TITLE_ID}
          eyebrow={t("auth.confirm.eyebrow")}
          title={t("auth.confirm.title")}
          subtitle={t("auth.confirm.subtitle", { email: getValues("email").trim() })}
        />
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(createAccount)} className="grid gap-[18px]">
      <AuthHeader titleId={SIGN_UP_TITLE_ID} eyebrow={t("auth.signUp.eyebrow")} title={t("auth.signUp.title")} subtitle={t("auth.signUp.subtitle")} />
      {errors.root?.message && <ErrorBanner>{errors.root.message}</ErrorBanner>}
      <GoogleButton onClick={continueWithGoogle} loading={googleLoading} />
      <OrDivider />
      <Controller
        name="fullName"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label={t("auth.fields.name")}
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            valid={fullName.trim().length >= 2}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <PhoneField
            {...field}
            label={t("auth.fields.phone")}
            enterKeyHint="next"
            hint={t("auth.fields.phoneHint")}
            error={fieldState.error?.message}
          />
        )}
      />
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
            error={
              fieldState.error?.type === "taken" ? (
                <>
                  {fieldState.error.message}{" "}
                  <Button variant="link" onClick={onSwitchToSignIn}>
                    {t("auth.errors.signInInstead")}
                  </Button>
                </>
              ) : (
                fieldState.error?.message
              )
            }
          />
        )}
      />
      <div className="grid gap-2">
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordField
              {...field}
              label={t("auth.fields.password")}
              autoComplete="new-password"
              enterKeyHint="done"
              error={fieldState.error?.message}
            />
          )}
        />
        <PasswordRules value={password} />
      </div>
      <SubmitButton loading={isSubmitting}>{t("auth.signUp.submit")}</SubmitButton>
      <Typography variant="caption" color="muted" className="text-center">
        {t("auth.signUp.legalStart")}
        <Link href={localePath(locale, "/privacy")} className="underline underline-offset-[3px]">
          {t("auth.signUp.privacy")}
        </Link>
        {t("auth.signUp.legalEnd")}
      </Typography>
    </form>
  );
}
