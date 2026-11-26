import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Emphasis } from "@/components/auth/AuthHeader";
import Seo from "@/components/seo/Seo";
import { Button, Typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchProfile, signOut, useCustomerSession, type Profile } from "@/lib/auth";
import { AUTH_STORAGE, formatPhone, phoneDigits, readLocal, readSession, safeNext, writeSession } from "@/lib/auth/form";

// My account (/ar/account/). Static page: the browser reads the session and profile.
// Also where Google sign-in lands: a new Google account without a phone goes to /account/complete/
// once, and a stored `next` (the page she started from) is honoured.
// For now it shows the profile and a sign-out button; orders and addresses come later.

export default function AccountPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { status, user } = useCustomerSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (status === "signedOut") {
      router.replace(localePath(locale, "/sign-in?next=/account/"));
      return;
    }
    if (status !== "signedIn" || !user) return;
    let active = true;
    fetchProfile(user.id)
      .then((p) => {
        if (!active) return;
        if (!p?.phone && !readLocal(AUTH_STORAGE.phoneSkip)) {
          router.replace(localePath(locale, "/account/complete"));
          return;
        }
        const next = safeNext(readSession(AUTH_STORAGE.next));
        if (next) {
          writeSession(AUTH_STORAGE.next, null);
          router.replace(localePath(locale, next));
          return;
        }
        setProfile(p);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [status, user, router, locale]);

  async function leave() {
    await signOut();
    router.replace(localePath(locale, "/"));
  }

  const rows = [
    { label: t("account.name"), value: profile?.full_name || "—" },
    { label: t("account.email"), value: user?.email ?? "—", ltr: true },
    { label: t("account.phone"), value: profile?.phone ? `+20 ${formatPhone(phoneDigits(profile.phone))}` : t("account.noPhone"), ltr: Boolean(profile?.phone) },
  ];

  return (
    <>
      <Seo title={t("nav.account")} noindex />
      <section className="mx-auto grid max-w-xl gap-8 px-4 pt-8 pb-16 md:px-8 md:pt-14 md:pb-24">
        <header className="grid gap-2">
          <Typography variant="eyebrow" color="wine">
            {t("account.eyebrow")}
          </Typography>
          <Typography variant="h1" color="burgundy" className="[&_em]:text-wine rtl:[&_em]:not-italic">
            <Emphasis text={t("account.title")} />
          </Typography>
        </header>

        {!profile ? (
          <Typography color="muted" role="status">
            {t("account.loading")}
          </Typography>
        ) : (
          <>
            <dl className="grid rounded-field bg-white px-4 shadow-[0_1px_0_rgb(42_4_13/0.06)]">
              {rows.map((row) => (
                <div key={row.label} className="grid gap-1 border-b border-ink/[0.08] py-3.5 last:border-b-0 md:grid-cols-[9rem_1fr] md:gap-4">
                  <Typography as="dt" variant="bodySm" color="muted">
                    {row.label}
                  </Typography>
                  <Typography as="dd" className="min-w-0 break-words">
                    {row.ltr ? <bdi dir="ltr">{row.value}</bdi> : row.value}
                  </Typography>
                </div>
              ))}
            </dl>
            <div className="grid gap-2.5 md:flex">
              {!profile.phone && (
                <Button href={localePath(locale, "/account/complete")} shape="field" fullWidth="mobile">
                  {t("account.addPhone")}
                </Button>
              )}
              <Button variant="outline" shape="field" fullWidth="mobile" onClick={leave}>
                {t("account.signOut")}
              </Button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
