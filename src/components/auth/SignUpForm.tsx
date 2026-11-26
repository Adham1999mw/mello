import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button, PasswordField, PasswordRules, PhoneField, TextField, Typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { authErrorReason, signInWithGoogle, signUp } from "@/lib/auth";
import {
  AUTH_STORAGE,
  firstName,
  formatPhone,
  isValidPhoneDigits,
  readSession,
  toLocalPhone,
  writeSession,
} from "@/lib/auth/form";
import { SIGN_UP_STEP1_FIELDS, signUpSchema, type SignUpValues } from "@/lib/auth/schemas";
import AuthHeader from "./AuthHeader";
import { BigCheckIcon, BoxIcon, DeviceIcon, MailIcon, PenIcon } from "./AuthIcons";
import { authHref, useAuthNext, useFocusTitle } from "./useAuthPage";
import { AccountSummary, ErrorBanner, GoogleButton, OrDivider, StatusBadge, StepProgress, SubmitButton } from "./AuthParts";

// The "Create account" tab of the sign-in page (AuthPage). Spec: docs/auth-flow-spec.md → 7.2–7.4.
//
//   Step 1  About you: full name + mobile (+20)          /sign-in/?tab=sign-up
//   Step 2  Your login: email + password                 /sign-in/?tab=sign-up&step=2 (real history entry,
//                                                        so the phone's back button returns to step 1)
//   Done    Welcome (signed in right away), or "confirm your email" if Supabase's
//           "Confirm email" is turned on later.
//
// One react-hook-form form holds both steps, so the values survive moving between them.
// Step 1 (never the password) is also kept in sessionStorage, so a reload on step 2 keeps it.
// `?next=/checkout/` is where she goes after signing up (default: home).

type Values = SignUpValues;
export type SignUpStage = "form" | "welcome" | "confirm";

export const SIGN_UP_TITLE_ID = "auth-title-sign-up";

type SignUpFormProps = {
  /** This tab is the one showing. */
  active: boolean;
  /** "Sign in instead" (the email already has an account): switch to the sign-in tab. */
  onSwitchToSignIn: () => void;
  /** Tells the page when the welcome / confirm screen shows, so it can hide the tabs. */
  onStageChange?: (stage: SignUpStage) => void;
};

export default function SignUpForm({ active, onSwitchToSignIn, onStageChange }: SignUpFormProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { next } = useAuthNext();
  const step: 1 | 2 = active && router.query.step === "2" ? 2 : 1;
  const [stage, setStageState] = useState<SignUpStage>("form");
  const setStage = (value: SignUpStage) => {
    setStageState(value);
    onStageChange?.(value);
  };
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

  const goToStep = (target: 1 | 2, replace = false) => {
    const href = authHref(locale, { tab: "signUp", step: target, next });
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

  // Email typed in the other tab, when this tab opens and hers is empty.
  useEffect(() => {
    if (!active || getValues("email")) return;
    const email = readSession(AUTH_STORAGE.email);
    if (email) setValue("email", email);
  }, [active, getValues, setValue]);

  // Move focus to the new title when the step or screen changes (not on the first load, and not
  // when she switches tabs: focus stays on the tab then).
  useFocusTitle(`${step}-${stage}`, SIGN_UP_TITLE_ID, active);

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

  let content;
  if (stage === "welcome") {
    content = (
      <div className="grid gap-[18px]">
        <StatusBadge>
          <BigCheckIcon />
        </StatusBadge>
        <AuthHeader
          titleId={SIGN_UP_TITLE_ID}
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
          titleId={SIGN_UP_TITLE_ID}
          eyebrow={t("auth.confirm.eyebrow")}
          title={t("auth.confirm.title")}
          subtitle={t("auth.confirm.subtitle", { email: email.trim() })}
        />
      </div>
    );
  } else if (step === 1) {
    content = (
      <form noValidate onSubmit={continueToStep2} className="grid gap-[18px]">
        <StepProgress step={1} label={t("auth.signUp.step1")} />
        <AuthHeader titleId={SIGN_UP_TITLE_ID} eyebrow={t("auth.signUp.eyebrow1")} title={t("auth.signUp.title1")} subtitle={t("auth.signUp.subtitle1")} />
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
        <AuthHeader titleId={SIGN_UP_TITLE_ID} eyebrow={t("auth.signUp.eyebrow2")} title={t("auth.signUp.title2")} subtitle={t("auth.signUp.subtitle2")} />
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
                <Button variant="link" onClick={onSwitchToSignIn}>
                  {t("auth.errors.signInInstead")}
                </Button>
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

  return content;
}
