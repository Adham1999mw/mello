import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm, useWatch } from "react-hook-form";
import Seo from "@/components/seo/Seo";
import { Button, PasswordField, PasswordRules, Typography, toast } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { authErrorReason, updatePassword, verifyRecoveryLink } from "@/lib/auth";
import { useCustomer } from "@/store/hooks";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth/schemas";
import AuthHeader from "./AuthHeader";
import { BigCheckIcon, ClockIcon, Spinner } from "./AuthIcons";
import AuthLayout from "./AuthLayout";
import { AuthLink, ErrorBanner, StatusBadge, SubmitButton } from "./AuthParts";
import { AUTH_TITLE_ID, useFocusTitle } from "./useAuthPage";

// Reset password (/ar/reset-password/), opened from the email link. Spec: docs/auth-flow-spec.md → 7.9–7.11.
//
//   checking  verifyRecoveryLink() signs her in from the link (token_hash or PKCE code)
//   form      new password (with rules) + confirm
//   expired   the link was used or is older than an hour → ask for a new one
//   done      password saved, she is signed in

type Stage = "checking" | "form" | "expired" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { user } = useCustomer();
  const [stage, setStage] = useState<Stage>("checking");
  useFocusTitle(stage);
  const schema = useMemo(() => resetPasswordSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: yupResolver(schema), mode: "onTouched", defaultValues: { password: "", confirm: "" } });
  const [password = "", confirm = ""] = useWatch({ control, name: ["password", "confirm"] });

  // Check the link once (a token can only be used once, so never twice in a row).
  const checked = useRef(false);
  useEffect(() => {
    if (!router.isReady || checked.current) return;
    checked.current = true;
    verifyRecoveryLink()
      .then((ok) => setStage(ok ? "form" : "expired"))
      .catch(() => setStage("expired"));
  }, [router.isReady]);

  async function submit({ password }: ResetPasswordValues) {
    try {
      await updatePassword(password);
      toast.success({ title: t("auth.toast.passwordUpdated.title"), message: t("auth.toast.passwordUpdated.message") });
      setStage("done");
    } catch (error) {
      const reason = authErrorReason(error);
      if (reason === "samePassword") setError("password", { message: t("auth.errors.samePassword") }, { shouldFocus: true });
      else if (reason === "weakPassword") setError("password", { message: t("auth.errors.weakPassword") }, { shouldFocus: true });
      else if (reason === "linkExpired") setStage("expired");
      else setError("root", { message: t("auth.errors.generic") });
    }
  }

  const matches = Boolean(confirm) && confirm === password;
  let content;
  if (stage === "checking") {
    content = (
      <div className="grid min-h-60 place-items-center" role="status">
        <span className="flex items-center gap-3 text-ink-muted">
          <Spinner />
          <Typography as="span" variant="bodySm">
            {t("auth.reset.checking")}
          </Typography>
        </span>
      </div>
    );
  } else if (stage === "expired") {
    content = (
      <div className="grid gap-[18px]">
        <StatusBadge>
          <ClockIcon />
        </StatusBadge>
        <AuthHeader titleId={AUTH_TITLE_ID} eyebrow={t("auth.expired.eyebrow")} title={t("auth.expired.title")} subtitle={t("auth.expired.subtitle")} />
        <Button href={localePath(locale, "/forgot-password")} shape="field" fullWidth>
          {t("auth.expired.submit")}
        </Button>
        <div className="grid justify-items-center">
          <AuthLink href={localePath(locale, "/sign-in")}>{t("auth.forgot.back")}</AuthLink>
        </div>
      </div>
    );
  } else if (stage === "done") {
    content = (
      <div className="grid gap-[18px]">
        <StatusBadge>
          <BigCheckIcon />
        </StatusBadge>
        <AuthHeader titleId={AUTH_TITLE_ID} eyebrow={t("auth.done.eyebrow")} title={t("auth.done.title")} subtitle={t("auth.done.subtitle")} />
        <Button href={localePath(locale, "/")} shape="field" fullWidth>
          {t("auth.done.shop")}
        </Button>
      </div>
    );
  } else {
    content = (
      <form noValidate onSubmit={handleSubmit(submit)} className="grid gap-[18px]">
        <AuthHeader
          titleId={AUTH_TITLE_ID}
          eyebrow={t("auth.reset.eyebrow")}
          title={t("auth.reset.title")}
          subtitle={user?.email ? t("auth.reset.subtitle", { email: user.email }) : undefined}
        />
        {errors.root?.message && <ErrorBanner>{errors.root.message}</ErrorBanner>}
        {/* A hidden username helps password managers save the new password to the right account. */}
        {user?.email && <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />}
        <div className="grid gap-2">
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <PasswordField
                {...field}
                label={t("auth.fields.newPassword")}
                autoComplete="new-password"
                enterKeyHint="next"
                error={fieldState.error?.message}
              />
            )}
          />
          <PasswordRules value={password} />
        </div>
        <Controller
          name="confirm"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordField
              {...field}
              label={t("auth.fields.confirmPassword")}
              autoComplete="new-password"
              enterKeyHint="done"
              error={fieldState.error?.message}
              success={!fieldState.error && matches ? t("auth.reset.match") : undefined}
              hint={!fieldState.error && !matches && fieldState.isTouched && confirm ? t("auth.reset.noMatch") : undefined}
            />
          )}
        />
        <SubmitButton loading={isSubmitting}>{t("auth.reset.submit")}</SubmitButton>
      </form>
    );
  }

  return (
    <>
      <Seo title={t("auth.seo.reset")} noindex />
      <AuthLayout closeHref={localePath(locale, "/")}>{content}</AuthLayout>
    </>
  );
}
