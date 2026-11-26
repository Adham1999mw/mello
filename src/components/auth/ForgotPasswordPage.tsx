import { useEffect, useMemo, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import Seo from "@/components/seo/Seo";
import { Button, FieldMessage, TextField, Typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { authErrorReason, sendPasswordReset } from "@/lib/auth";
import { AUTH_STORAGE, readSession, writeSession } from "@/lib/auth/form";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth/schemas";
import AuthHeader from "./AuthHeader";
import { MailIcon, Spinner } from "./AuthIcons";
import AuthLayout from "./AuthLayout";
import { AuthLink, ErrorBanner, StatusBadge, SubmitButton } from "./AuthParts";
import { AUTH_TITLE_ID, useFocusTitle } from "./useAuthPage";

// Forgot password (/ar/forgot-password/). Spec: docs/auth-flow-spec.md → 7.7, 7.8.
// The reset link is the only email the store sends. The "sent" screen never says whether the
// email has an account. Supabase limits resends, so the resend button waits 60 seconds.

const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const [sentTo, setSentTo] = useState<string | null>(null);
  useFocusTitle(sentTo ? "sent" : "form");
  const schema = useMemo(() => forgotPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: yupResolver(schema), mode: "onTouched", defaultValues: { email: "" } });

  useEffect(() => {
    const email = readSession(AUTH_STORAGE.email);
    if (email) setValue("email", email);
  }, [setValue]);

  async function submit({ email }: ForgotPasswordValues) {
    const clean = email;
    try {
      await sendPasswordReset(locale, clean);
      setSentTo(clean);
    } catch (error) {
      // Too many requests still means a link was sent recently: show the sent screen.
      if (authErrorReason(error) === "rateLimited") setSentTo(clean);
      else setError("root", { message: t("auth.errors.generic") });
    }
  }

  return (
    <>
      <Seo title={t("auth.seo.forgot")} noindex />
      <AuthLayout closeHref={localePath(locale, "/sign-in")}>
        {sentTo ? (
          <div className="grid gap-[18px]">
            <StatusBadge>
              <MailIcon />
            </StatusBadge>
            <AuthHeader
              titleId={AUTH_TITLE_ID}
              eyebrow={t("auth.sent.eyebrow")}
              title={t("auth.sent.title")}
              subtitle={t("auth.sent.subtitle", { email: sentTo })}
            />
            <Typography variant="bodySm" color="muted">
              {t("auth.sent.tip")}
            </Typography>
            <ResendButton email={sentTo} />
            <div className="grid justify-items-center">
              <Button variant="link" onClick={() => setSentTo(null)}>
                {t("auth.sent.other")}
              </Button>
              <AuthLink href={localePath(locale, "/sign-in")}>{t("auth.forgot.back")}</AuthLink>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit(submit)} className="grid gap-[18px]">
            <AuthHeader titleId={AUTH_TITLE_ID} eyebrow={t("auth.forgot.eyebrow")} title={t("auth.forgot.title")} subtitle={t("auth.forgot.subtitle")} />
            {errors.root?.message && <ErrorBanner>{errors.root.message}</ErrorBanner>}
            <TextField
              label={t("auth.fields.email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t("auth.fields.emailPlaceholder")}
              enterKeyHint="send"
              ltr
              error={errors.email?.message}
              {...register("email", {
                onChange: (e) => writeSession(AUTH_STORAGE.email, e.target.value),
              })}
            />
            <SubmitButton loading={isSubmitting}>{t("auth.forgot.submit")}</SubmitButton>
            <div className="grid justify-items-center">
              <AuthLink href={localePath(locale, "/sign-in")}>{t("auth.forgot.back")}</AuthLink>
            </div>
          </form>
        )}
      </AuthLayout>
    </>
  );
}

/** "Resend in 0:59" countdown, then "Resend link". Sends the same email again. */
function ResendButton({ email }: { email: string }) {
  const { t, locale } = useTranslation();
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  async function resend() {
    setSending(true);
    setResent(false);
    try {
      await sendPasswordReset(locale, email);
      setResent(true);
    } catch {
      // Rate limited or offline: just wait again.
    }
    setSending(false);
    setLeft(RESEND_SECONDS);
  }

  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  return (
    <div className="grid gap-2">
      <Button
        variant="outline"
        shape="field"
        fullWidth
        disabled={left > 0 || sending}
        onClick={resend}
        startIcon={sending ? <Spinner /> : undefined}
      >
        {left > 0 ? <span className="tabular-nums">{t("auth.sent.resendIn", { time })}</span> : t("auth.sent.resend")}
      </Button>
      {resent && (
        <FieldMessage tone="success" className="justify-center">
          <span role="status">{t("auth.sent.resent")}</span>
        </FieldMessage>
      )}
    </div>
  );
}
