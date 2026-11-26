import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm, useWatch } from "react-hook-form";
import Seo from "@/components/seo/Seo";
import { Button, PasswordField, PasswordRules, PhoneField, TextField, Typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { authErrorReason, signInWithGoogle, signUp, useCustomerSession } from "@/lib/auth";
import {
  AUTH_STORAGE,
  firstName,
  formatPhone,
  isValidPhoneDigits,
  readSession,
  safeNext,
  toLocalPhone,
  writeSession,
} from "@/lib/auth/form";
import { SIGN_UP_STEP1_FIELDS, signUpSchema, type SignUpValues } from "@/lib/auth/schemas";
import AuthHeader from "./AuthHeader";
import { BigCheckIcon, BoxIcon, DeviceIcon, MailIcon, PenIcon } from "./AuthIcons";
import AuthLayout from "./AuthLayout";
import { AccountSummary, AuthTabs, ErrorBanner, GoogleButton, OrDivider, StatusBadge, StepProgress, SubmitButton } from "./AuthParts";

// Sign up (/ar/sign-up/, /en/sign-up/). Static page, so it works on GitHub Pages too.
// Spec: docs/auth-flow-spec.md (Atelier v2) → 7.2–7.4.
//
//   Step 1  About you: full name + mobile (+20)          /sign-up/
//   Step 2  Your login: email + password                 /sign-up/?step=2 (real history entry,
//                                                        so the phone's back button returns to step 1)
//   Done    Welcome (signed in right away), or "confirm your email" if Supabase's
//           "Confirm email" is turned on later.
//
// One react-hook-form form holds both steps, so the values survive moving between them.
// Step 1 (never the password) is also kept in sessionStorage, so a reload on step 2 keeps it.
// `?next=/checkout/` is where she goes after signing up (default: home).

type Values = SignUpValues;
type Stage = "form" | "welcome" | "confirm";

const TITLE_ID = "auth-title";

export default function SignUpPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { status } = useCustomerSession();
  const step: 1 | 2 = router.query.step === "2" ? 2 : 1;
  const next = safeNext(router.query.next);
  const [stage, setStage] = useState<Stage>("form");
  const [googleLoading, setGoogleLoading] = useState(false);
  const schema = useMemo(() => signUpSchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: yupResolver(schema),
    // Check a field when she leaves it, then on every change once it has an error.
    mode: "onTouched",
    defaultValues: { fullName: "", phone: "", email: "", password: "" },
  });

  const withNext = (path: string) => localePath(locale, next ? `${path}?next=${encodeURIComponent(next)}` : path);
  const goToStep = (target: 1 | 2, replace = false) => {
    const params = new URLSearchParams();
    if (next) params.set("next", next);
    if (target === 2) params.set("step", "2");
    const query = params.toString();
    const href = localePath(locale, query ? `/sign-up?${query}` : "/sign-up");
    (replace ? router.replace : router.push)(href, undefined, { shallow: true });
  };

  // Once the URL is known: bring back step 1 and the email typed on another auth page. If step 2
  // was opened without a valid step 1 (a shared link, or storage was cleared), start at step 1.
  const restored = useRef(false);
  useEffect(() => {
    if (!router.isReady || restored.current) return;
    restored.current = true;
    try {
      const saved = JSON.parse(readSession(AUTH_STORAGE.signup) ?? "null") as Partial<Values> | null;
      if (saved?.fullName) setValue("fullName", saved.fullName);
      if (saved?.phone) setValue("phone", saved.phone);
    } catch {
      // Ignore a broken saved value.
    }
    const email = readSession(AUTH_STORAGE.email);
    if (email) setValue("email", email);

    const { fullName, phone } = getValues();
    if (step === 2 && (fullName.trim().length < 2 || !isValidPhoneDigits(phone))) goToStep(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Already signed in when the page opens: nothing to do here.
  const firstStatus = useRef(true);
  useEffect(() => {
    if (status === "loading" || !firstStatus.current) return;
    firstStatus.current = false;
    if (status === "signedIn") router.replace(localePath(locale, next ?? "/"));
  }, [status, router, locale, next]);

  // Move focus to the new title when the step or screen changes (not on the first load).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.getElementById(TITLE_ID)?.focus();
    window.scrollTo({ top: 0 });
  }, [step, stage]);

  async function continueToStep2(e: FormEvent) {
    e.preventDefault();
    const ok = await trigger([...SIGN_UP_STEP1_FIELDS], { shouldFocus: true });
    if (!ok) return;
    const { fullName, phone } = getValues();
    writeSession(AUTH_STORAGE.signup, JSON.stringify({ fullName: fullName.trim(), phone }));
    goToStep(2);
  }

  async function createAccount(values: Values) {
    try {
      const { signedIn } = await signUp(locale, {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: toLocalPhone(values.phone),
      });
      writeSession(AUTH_STORAGE.signup, null);
      setStage(signedIn ? "welcome" : "confirm");
    } catch (error) {
      const reason = authErrorReason(error);
      if (reason === "emailTaken") setError("email", { type: "taken", message: t("auth.errors.emailTaken") }, { shouldFocus: true });
      else if (reason === "invalidEmail") setError("email", { type: "server", message: t("auth.errors.invalidEmail") }, { shouldFocus: true });
      else if (reason === "weakPassword") setError("password", { type: "server", message: t("auth.errors.weakPassword") }, { shouldFocus: true });
      else if (reason === "rateLimited") setError("root", { message: t("auth.errors.rateLimited") });
      else if (reason === "signupDisabled") setError("root", { message: t("auth.errors.signupDisabled") });
      else setError("root", { message: t("auth.errors.generic") });
    }
  }

  async function continueWithGoogle() {
    setGoogleLoading(true);
    writeSession(AUTH_STORAGE.next, next);
    try {
      await signInWithGoogle(locale); // leaves the page
    } catch {
      setGoogleLoading(false);
      setError("root", { message: t("auth.errors.generic") });
    }
  }

  const { fullName = "", phone = "", email = "", password = "" } = useWatch({ control });
  const tabs = <AuthTabs current="signUp" />;

  let content;
  if (stage === "welcome") {
    content = (
      <div className="grid gap-[18px]">
        <StatusBadge>
          <BigCheckIcon />
        </StatusBadge>
        <AuthHeader
          titleId={TITLE_ID}
          eyebrow={t("auth.welcome.eyebrow")}
          title={t("auth.welcome.title", { name: firstName(fullName) })}
          subtitle={t("auth.welcome.subtitle")}
        />
        <ul className="grid">
          {[
            { icon: <DeviceIcon />, text: t("auth.welcome.perk1") },
            { icon: <PenIcon />, text: t("auth.welcome.perk2") },
            { icon: <BoxIcon />, text: t("auth.welcome.perk3") },
          ].map((perk) => (
            <li key={perk.text} className="flex items-center gap-3 border-b border-ink/[0.08] py-3">
              <span className="flex shrink-0 text-wine">{perk.icon}</span>
              <Typography as="span">{perk.text}</Typography>
            </li>
          ))}
        </ul>
        <div className="grid gap-2.5">
          <Button href={localePath(locale, next ?? "/")} shape="field" fullWidth>
            {t("auth.welcome.shop")}
          </Button>
          <Button href={localePath(locale, "/account")} variant="outline" shape="field" fullWidth>
            {t("auth.welcome.account")}
          </Button>
        </div>
      </div>
    );
  } else if (stage === "confirm") {
    content = (
      <div className="grid gap-[18px]">
        <StatusBadge>
          <MailIcon />
        </StatusBadge>
        <AuthHeader
          titleId={TITLE_ID}
          eyebrow={t("auth.confirm.eyebrow")}
          title={t("auth.confirm.title")}
          subtitle={t("auth.confirm.subtitle", { email: email.trim() })}
        />
      </div>
    );
  } else if (step === 1) {
    content = (
      <form noValidate onSubmit={continueToStep2} className="grid gap-[18px]">
        {tabs}
        <StepProgress step={1} label={t("auth.signUp.step1")} />
        <AuthHeader titleId={TITLE_ID} eyebrow={t("auth.signUp.eyebrow1")} title={t("auth.signUp.title1")} subtitle={t("auth.signUp.subtitle1")} />
        {errors.root?.message && <ErrorBanner>{errors.root.message}</ErrorBanner>}
        <GoogleButton onClick={continueWithGoogle} loading={googleLoading} />
        <OrDivider />
        <TextField
          label={t("auth.fields.name")}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          valid={fullName.trim().length >= 2}
          error={errors.fullName?.message}
          {...register("fullName")}
        />
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
              enterKeyHint="next"
              hint={t("auth.fields.phoneHint")}
              error={fieldState.error?.message}
            />
          )}
        />
        <SubmitButton>{t("auth.signUp.continue")}</SubmitButton>
      </form>
    );
  } else {
    content = (
      <form noValidate onSubmit={handleSubmit(createAccount)} className="grid gap-[18px]">
        {tabs}
        <StepProgress step={2} label={t("auth.signUp.step2")} />
        <AccountSummary
          name={fullName.trim()}
          detail={`+20 ${formatPhone(phone)}`}
          action={
            <Button variant="link" onClick={() => goToStep(1)} className="mx-1.5">
              {t("auth.signUp.edit")}
            </Button>
          }
        />
        <AuthHeader titleId={TITLE_ID} eyebrow={t("auth.signUp.eyebrow2")} title={t("auth.signUp.title2")} subtitle={t("auth.signUp.subtitle2")} />
        {errors.root?.message && <ErrorBanner>{errors.root.message}</ErrorBanner>}
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
          error={
            errors.email?.type === "taken" ? (
              <>
                {errors.email.message}{" "}
                <Link href={withNext("/sign-in")} className="font-medium underline underline-offset-4">
                  {t("auth.errors.signInInstead")}
                </Link>
              </>
            ) : (
              errors.email?.message
            )
          }
          {...register("email", {
            onChange: (e) => writeSession(AUTH_STORAGE.email, e.target.value),
          })}
        />
        <div className="grid gap-2">
          <PasswordField
            label={t("auth.fields.password")}
            autoComplete="new-password"
            enterKeyHint="done"
            error={errors.password?.message}
            {...register("password")}
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

  return (
    <>
      <Seo title={t("auth.seo.signUp")} noindex />
      <AuthLayout closeHref={localePath(locale, next ?? "/")}>{content}</AuthLayout>
    </>
  );
}
