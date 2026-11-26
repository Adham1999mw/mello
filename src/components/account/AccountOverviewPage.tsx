import Seo from "@/components/seo/Seo";
import { Button, Typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { firstName } from "@/lib/auth";
import AccountLayout, { PhoneNudge } from "./AccountLayout";
import { displayPhone, useAccount } from "./useAccount";

// /account/: on phones the menu (in AccountLayout) is the page; from md up this overview shows
// next to it: a greeting and a summary of her details.
export default function AccountOverviewPage() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t("account.seo.overview")} noindex />
      <AccountLayout page="overview">
        <Overview />
      </AccountLayout>
    </>
  );
}

function Overview() {
  const { t, locale } = useTranslation();
  const { user, profile } = useAccount();
  const name = firstName(profile?.full_name);

  return (
    <div className="grid max-w-[620px] gap-6">
      <div className="grid gap-2">
        <Typography variant="h1" as="h1">
          {name ? t("account.hello", { name }) : t("account.helloNoName")}
        </Typography>
        <Typography variant="bodySm" color="muted">
          {t("account.intro")}
        </Typography>
      </div>

      {!profile?.phone && <PhoneNudge />}

      <section aria-labelledby="account-details" className="grid gap-3 rounded-field border border-ink/[0.08] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <Typography variant="subtitle" as="h2" id="account-details">
            {t("account.details.title")}
          </Typography>
          <Button variant="link" href={localePath(locale, "/account/details")}>
            {t("account.details.edit")}
          </Button>
        </div>
        <dl className="grid gap-3">
          <Item label={t("auth.fields.name")}>{profile?.full_name}</Item>
          <Item label={t("auth.fields.phone")}>
            {profile?.phone ? <bdi dir="ltr">{displayPhone(profile.phone)}</bdi> : t("account.details.noPhone")}
          </Item>
          <Item label={t("auth.fields.email")}>{user?.email}</Item>
        </dl>
      </section>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid">
      <Typography variant="caption" as="dt" color="muted">
        {label}
      </Typography>
      <Typography as="dd" className="break-words">
        {children}
      </Typography>
    </div>
  );
}
