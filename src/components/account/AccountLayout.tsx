import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, IconButton, Typography, cn } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { assetPath } from "@/lib/assetPath";
import { signOut } from "@/lib/auth";
import { displayPhone, initials, memberSince, useAccount } from "./useAccount";

// Frame of the account pages ("The Hub" design). Mobile first:
//   Phones   /account/ shows the burgundy band with her name and the menu (rows + sign out).
//            A sub-page (/account/details/) shows only its content, with a back button.
//   md and up  the band on top, then the menu as a side column next to the page content.
//
//   <AccountLayout page="details">...form...</AccountLayout>

export type AccountPageId = "overview" | "details";

type AccountLayoutProps = { page: AccountPageId; children: ReactNode };

export default function AccountLayout({ page, children }: AccountLayoutProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { ready, profileStatus } = useAccount();
  const isOverview = page === "overview";

  if (!ready) return <div aria-busy="true" className="min-h-[60vh]" />;

  return (
    <div className="pb-16 md:pb-24">
      <div className={cn(!isOverview && "hidden md:block")}>
        <AccountHero />
      </div>

      <div className="relative z-10 mx-auto -mt-6 max-w-[1088px] md:-mt-14 md:grid md:grid-cols-[300px_minmax(0,1fr)] md:items-start md:gap-8 md:px-14 xl:px-0">
        <aside className={cn(isOverview ? "block" : "hidden md:block", "md:sticky md:top-28")}>
          <AccountMenu page={page} />
        </aside>

        <div
          className={cn(
            isOverview ? "hidden md:block" : "block",
            "px-5 pt-4 md:rounded-field md:border md:border-ink/[0.08] md:bg-ivory md:px-11 md:py-10 md:shadow-[0_24px_50px_-34px_rgb(42_4_13/0.45)]",
          )}
        >
          {!isOverview && (
            <IconButton label={t("account.back")} onClick={() => router.push(localePath(locale, "/account"))} className="-ms-3 mb-2 md:hidden">
              <BackIcon />
            </IconButton>
          )}
          {profileStatus === "failed" ? <Typography color="danger">{t("account.loadError")}</Typography> : children}
        </div>
      </div>
    </div>
  );
}

/** Burgundy band with her initials, name, email and "Member since". Animated (globals.css → Account header). */
function AccountHero() {
  const { t, locale } = useTranslation();
  const { user, profile } = useAccount();
  const name = profile?.full_name?.trim() ?? "";

  return (
    <section className="auth-panel-bg relative overflow-hidden px-5 pt-7 pb-14 text-champagne md:px-14 md:pt-11 md:pb-24">
      {/* Stitched thread (same as the sign-in panel): sews itself in, then keeps moving. */}
      <svg viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true" className="auth-thread pointer-events-none absolute inset-0 size-full">
        <g className="account-sew-in">
          <path d="M-20 230 C 200 150, 380 290, 620 210 S 1000 90, 1220 170" />
          <path d="M-20 70 C 240 20, 420 120, 700 60 S 1060 10, 1220 50" opacity="0.3" />
        </g>
      </svg>
      <div className="relative mx-auto grid max-w-[1088px] gap-4">
        {/* The leather label from the sign-in panel, at the inline end of the band. */}
        <Image
          src={assetPath("/brand/needle-label.webp")}
          alt=""
          width={900}
          height={635}
          sizes="(min-width: 768px) 190px, 64px"
          className="account-rise pointer-events-none absolute -top-1 end-0 h-auto w-16 -rotate-[5deg] drop-shadow-[0_12px_16px_rgb(0_0_0/0.45)] [--rise-step:2] md:top-1/2 md:w-[190px] md:-translate-y-1/2"
        />
        <Typography variant="eyebrow" className="account-rise opacity-80">
          {t("account.eyebrow")}
        </Typography>
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="account-avatar grid size-14 shrink-0 place-items-center rounded-full bg-champagne font-display text-[26px] leading-none text-burgundy shadow-[0_0_0_4px_rgb(238_211_184/0.15)] md:size-[72px] md:text-[34px] rtl:font-medium"
          >
            {initials(name || user?.email)}
          </span>
          <div className="grid min-w-0 gap-1 pe-[68px] md:pe-56">
            <Typography variant="h1" as="p" className="account-rise break-words [--rise-step:1]">
              {name || user?.email}
            </Typography>
            <Typography variant="bodySm" className="account-rise break-all opacity-80 [--rise-step:2]">
              {user?.email}
            </Typography>
            {profile?.created_at && (
              <Typography variant="bodySm" className="account-rise opacity-80 [--rise-step:3]">
                {t("account.since", { date: memberSince(profile.created_at, locale) })}
              </Typography>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The list of account pages, the "add your mobile" note and the sign out button. */
function AccountMenu({ page }: { page: AccountPageId }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { profile } = useAccount();

  async function handleSignOut() {
    // Leave the page first, so the account page doesn't send her to sign in when the session ends.
    await router.replace(localePath(locale, "/"));
    await signOut();
  }

  const detailsSub = profile?.phone ? (
    <>
      {profile.full_name} · <bdi dir="ltr">{displayPhone(profile.phone)}</bdi>
    </>
  ) : (
    <span className="text-wine">{t("account.menu.noPhone")}</span>
  );

  return (
    <div className="grid gap-5 rounded-t-sheet bg-ivory px-4 pt-6 md:gap-3 md:rounded-field md:border md:border-ink/[0.08] md:bg-white md:p-3 md:shadow-[0_24px_50px_-34px_rgb(42_4_13/0.45)]">
      {!profile?.phone && (
        <div className="md:hidden">
          <PhoneNudge />
        </div>
      )}

      <nav aria-label={t("account.menu.label")} className="overflow-hidden rounded-field border border-ink/[0.08] bg-white md:border-0">
        <MenuRow href="/account" icon={<GridIcon />} label={t("account.menu.overview")} active={page === "overview"} desktopOnly />
        <MenuRow href="/account/details" icon={<UserIcon />} label={t("account.menu.details")} sub={detailsSub} active={page === "details"} />
      </nav>

      <div className="md:border-t md:border-ink/[0.08] md:px-1 md:pt-3">
        <Button variant="outline" shape="field" fullWidth startIcon={<SignOutIcon />} onClick={handleSignOut}>
          {t("account.signOut")}
        </Button>
      </div>
    </div>
  );
}

function MenuRow({
  href,
  icon,
  label,
  sub,
  active,
  desktopOnly,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  sub?: ReactNode;
  active: boolean;
  desktopOnly?: boolean;
}) {
  const { locale } = useTranslation();
  return (
    <Link
      href={localePath(locale, href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "min-h-[68px] items-center gap-3.5 border-ink/[0.07] px-4 py-3 not-first:border-t hover:bg-burgundy/[0.03]",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-burgundy",
        "md:min-h-[54px] md:rounded-[10px] md:border-0 md:px-2.5 md:py-2",
        active && "md:bg-leather",
        desktopOnly ? "hidden md:flex" : "flex",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ivory text-wine md:size-[34px] md:rounded-[9px] md:bg-white">
        {icon}
      </span>
      <span className="grid min-w-0 flex-1">
        <Typography variant="subtitle" as="span" className="text-[15px]">
          {label}
        </Typography>
        {sub && (
          <Typography variant="bodySm" as="span" color="muted" className="truncate md:hidden">
            {sub}
          </Typography>
        )}
      </span>
      <span className="text-ink/35 md:hidden">
        <ChevronIcon />
      </span>
    </Link>
  );
}

/** Leather note for a customer without a mobile number (Google sign-ups). */
export function PhoneNudge() {
  const { t, locale } = useTranslation();
  return (
    <div className="flex items-start gap-3 rounded-field bg-leather px-4 py-3.5 text-ink">
      <span className="mt-0.5 text-wine">
        <PhoneIcon />
      </span>
      <div className="grid min-w-0 justify-items-start">
        <Typography variant="subtitle" as="p" className="text-[15px]">
          {t("account.nudge.title")}
        </Typography>
        <Typography variant="bodySm">{t("account.nudge.body")}</Typography>
        <Button variant="link" href={localePath(locale, "/account/details")}>
          {t("account.nudge.cta")}
        </Button>
      </div>
    </div>
  );
}

// ---------- icons (20px line icons, like the header) ----------

function Icon({ children, flip }: { children: ReactNode; flip?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={flip ? "rtl:-scale-x-100" : undefined}
    >
      {children}
    </svg>
  );
}
const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
  </Icon>
);
const GridIcon = () => (
  <Icon>
    <rect x="4.5" y="4.5" width="6" height="6" rx="1.5" />
    <rect x="13.5" y="4.5" width="6" height="6" rx="1.5" />
    <rect x="4.5" y="13.5" width="6" height="6" rx="1.5" />
    <rect x="13.5" y="13.5" width="6" height="6" rx="1.5" />
  </Icon>
);
const PhoneIcon = () => (
  <Icon>
    <rect x="7" y="3.5" width="10" height="17" rx="2.5" />
    <path d="M11 17.5h2" />
  </Icon>
);
const SignOutIcon = () => (
  <Icon flip>
    <path d="M14 4.5H6.5v15H14" />
    <path d="M10.5 12h9M16.5 8.5 20 12l-3.5 3.5" />
  </Icon>
);
const ChevronIcon = () => (
  <Icon flip>
    <path d="m9.5 6 6 6-6 6" />
  </Icon>
);
const BackIcon = () => (
  <Icon flip>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);
