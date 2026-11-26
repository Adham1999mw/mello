import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import Seo from "@/components/seo/Seo";
import { Button, PhoneField } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchProfile, saveProfile, useCustomerSession } from "@/lib/auth";
import { AUTH_STORAGE, readSession, safeNext, toLocalPhone, writeLocal, writeSession } from "@/lib/auth/form";
import { addPhoneSchema, type AddPhoneValues } from "@/lib/auth/schemas";
import AuthHeader from "./AuthHeader";
import { Spinner } from "./AuthIcons";
import AuthLayout from "./AuthLayout";
import { AccountSummary, ErrorBanner, SubmitButton } from "./AuthParts";
import { AUTH_TITLE_ID } from "./useAuthPage";

// Add mobile (/ar/account/complete/). Google gives a name and email but no phone, so after a
// Google sign-up /account/ sends her here once. Spec: docs/auth-flow-spec.md → 7.5, 7.6.
// "Add it at checkout" skips it (remembered in localStorage).

export default function AddPhonePage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { status, user } = useCustomerSession();
  const [name, setName] = useState("");
  const schema = useMemo(() => addPhoneSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddPhoneValues>({ resolver: yupResolver(schema), mode: "onTouched", defaultValues: { phone: "" } });

  useEffect(() => {
    if (status === "signedOut") router.replace(localePath(locale, "/sign-in?next=/account/complete/"));
    if (status !== "signedIn" || !user) return;
    fetchProfile(user.id)
      .then((profile) => setName(profile?.full_name ?? ""))
      .catch(() => undefined);
  }, [status, user, router, locale]);

  /** Where to go next: the page she started from (stored before Google), else her account. */
  function leave() {
    const stored = safeNext(readSession(AUTH_STORAGE.next));
    writeSession(AUTH_STORAGE.next, null);
    router.replace(localePath(locale, stored ?? "/account"));
  }

  async function submit({ phone }: AddPhoneValues) {
    if (!user) return;
    try {
      await saveProfile(user.id, { phone: toLocalPhone(phone) });
      leave();
    } catch {
      setError("root", { message: t("auth.errors.generic") });
    }
  }

  function skip() {
    writeLocal(AUTH_STORAGE.phoneSkip, "1");
    leave();
  }

  return (
    <>
      <Seo title={t("auth.seo.addPhone")} noindex />
      <AuthLayout closeHref={localePath(locale, "/account")}>
        {status !== "signedIn" ? (
          <div className="grid min-h-60 place-items-center text-ink-muted" role="status">
            <Spinner />
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit(submit)} className="grid gap-[18px]">
            <AccountSummary name={name || user?.email || ""} detail={user?.email ?? ""} />
            <AuthHeader titleId={AUTH_TITLE_ID} eyebrow={t("auth.addPhone.eyebrow")} title={t("auth.addPhone.title")} subtitle={t("auth.addPhone.subtitle")} />
            {errors.root?.message && <ErrorBanner>{errors.root.message}</ErrorBanner>}
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <PhoneField
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  label={t("auth.fields.phone")}
                  enterKeyHint="done"
                  hint={t("auth.fields.phoneHint")}
                  error={fieldState.error?.message}
                />
              )}
            />
            <SubmitButton loading={isSubmitting}>{t("auth.addPhone.submit")}</SubmitButton>
            <div className="grid justify-items-center">
              <Button variant="link" onClick={skip}>
                {t("auth.addPhone.skip")}
              </Button>
            </div>
          </form>
        )}
      </AuthLayout>
    </>
  );
}
