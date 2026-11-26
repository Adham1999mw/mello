import { useMemo } from "react";
import { useRouter } from "next/router";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { ErrorBanner } from "@/components/auth/AuthParts";
import Seo from "@/components/seo/Seo";
import { Button, PhoneField, TextField, Typography, toast } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { saveProfile } from "@/lib/auth";
import { phoneDigits, toLocalPhone } from "@/lib/auth/form";
import { profileSchema, type ProfileValues } from "@/lib/auth/schemas";
import { profileUpdated } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import AccountLayout from "./AccountLayout";
import { useAccount } from "./useAccount";

// /account/details/: edit her name and mobile number (public.profiles). The email is shown read only.
export default function PersonalDetailsPage() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t("account.seo.details")} noindex />
      <AccountLayout page="details">
        <DetailsForm />
      </AccountLayout>
    </>
  );
}

function DetailsForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, locale } = useTranslation();
  const { user, profile } = useAccount();
  const schema = useMemo(() => profileSchema(t), [t]);
  const isGoogle = user?.provider === "google";

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: yupResolver(schema),
    mode: "onTouched",
    defaultValues: { fullName: profile?.full_name ?? "", phone: profile?.phone ? phoneDigits(profile.phone) : "" },
  });

  async function save(values: ProfileValues) {
    if (!user) return;
    const changes = { full_name: values.fullName.trim(), phone: values.phone ? toLocalPhone(values.phone) : null };
    try {
      await saveProfile(user.id, changes);
      dispatch(profileUpdated(changes));
      toast.success({ title: t("account.details.saved") });
      router.push(localePath(locale, "/account"));
    } catch {
      setError("root", { message: t("auth.errors.generic") });
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(save)} className="grid max-w-[620px] gap-[18px]">
      <div className="mb-1 grid gap-2">
        <Typography variant="h1">{t("account.details.title")}</Typography>
        <Typography variant="bodySm" color="muted">
          {t("account.details.subtitle")}
        </Typography>
      </div>

      {errors.root?.message && <ErrorBanner>{errors.root.message}</ErrorBanner>}

      <Controller
        name="fullName"
        control={control}
        render={({ field, fieldState }) => (
          <TextField {...field} label={t("auth.fields.name")} autoComplete="name" autoCapitalize="words" error={fieldState.error?.message} />
        )}
      />
      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <PhoneField
            {...field}
            label={t("auth.fields.phone")}
            optional={!profile?.phone}
            hint={t("auth.fields.phoneHint")}
            autoFocus={!profile?.phone}
            error={fieldState.error?.message}
          />
        )}
      />
      <TextField
        label={t("auth.fields.email")}
        value={user?.email ?? ""}
        readOnly
        ltr
        hint={isGoogle ? t("account.details.emailHintGoogle") : t("account.details.emailHint")}
      />

      <div className="mt-2 grid gap-2 md:flex md:gap-3">
        <Button type="submit" shape="field" fullWidth="mobile" disabled={!isDirty || isSubmitting}>
          {t("account.details.save")}
        </Button>
        <Button variant="text" shape="field" fullWidth="mobile" href={localePath(locale, "/account")}>
          {t("account.details.cancel")}
        </Button>
      </div>
    </form>
  );
}
