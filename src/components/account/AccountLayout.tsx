import { useId, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, IconButton, Typography, cn } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
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
      {/* Stitched thread, as in the Hub design: one dashed line across the band, under her name.
          It sews itself in on load, then keeps moving (globals.css → Account header). */}
      <svg viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true" className="auth-thread pointer-events-none absolute inset-0 size-full">
        <g className="account-sew-in">
          <path d="M-10 170 C 80 120, 140 200, 230 150 S 360 80, 420 120" />
        </g>
      </svg>
      <div className="relative mx-auto grid max-w-[1088px] gap-4">
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
          <div className="grid min-w-0 gap-1">
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

      <MenuGroup title={t("account.menu.settings")}>
        <MenuRow href="/account" icon={<GridIcon />} label={t("account.menu.overview")} active={page === "overview"} desktopOnly />
        <MenuRow href="/account/details" icon={<UserIcon />} label={t("account.menu.details")} sub={detailsSub} active={page === "details"} />
      </MenuGroup>

      <MenuGroup title={t("account.menu.shopping")}>
        {/* Orders come with checkout: shown now so the menu doesn't change shape later. */}
        <MenuRow icon={<BagIcon />} label={t("account.menu.orders")} sub={t("account.menu.ordersSub")} soon={t("account.menu.soon")} />
      </MenuGroup>

      <MenuGroup title={t("account.menu.help")}>
        <MenuRow href="/privacy#privacy-contact" icon={<ChatIcon />} label={t("account.menu.contact")} />
        <MenuRow href="/privacy" icon={<ShieldIcon />} label={t("account.menu.privacy")} />
      </MenuGroup>

      <div className="md:border-t md:border-ink/[0.08] md:px-1 md:pt-3">
        <Button variant="outline" shape="field" fullWidth startIcon={<SignOutIcon />} onClick={handleSignOut}>
          {t("account.signOut")}
        </Button>
        <Typography variant="caption" color="muted" as="p" className="mt-2 text-center tracking-[0.08em] md:hidden">
          {t("account.version")}
        </Typography>
      </div>
    </div>
  );
}

/** A titled list of menu rows ("Account settings", "Shopping", "Help"). */
function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <Typography variant="eyebrow" color="muted" as="h2" id={id} className="px-1 md:px-1.5 md:pt-2.5">
        {title}
      </Typography>
      <nav aria-labelledby={id} className="overflow-hidden rounded-field border border-ink/[0.08] bg-white md:border-0">
        {children}
      </nav>
    </section>
  );
}

/** A menu row: a link, or (without `href`) a coming-soon row with a "Soon" pill. */
function MenuRow({
  href,
  icon,
  label,
  sub,
  active = false,
  desktopOnly,
  soon,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  sub?: ReactNode;
  active?: boolean;
  desktopOnly?: boolean;
  /** Text of the pill on a row that isn't ready yet. */
  soon?: string;
}) {
  const { locale } = useTranslation();
  const content = (
    <>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-ivory text-wine md:size-[34px] md:rounded-[9px] md:bg-white", soon && "opacity-60")}>
        {icon}
      </span>
      <span className={cn("grid min-w-0 flex-1", soon && "opacity-60")}>
        <Typography variant="subtitle" as="span" className="text-[15px]">
          {label}
        </Typography>
        {sub && (
          <Typography variant="bodySm" as="span" color="muted" className="truncate md:hidden">
            {sub}
          </Typography>
        )}
      </span>
      {soon ? (
        <Typography variant="caption" as="span" color="muted" className="shrink-0 rounded-full bg-ink/[0.06] px-2.5 py-0.5">
          {soon}
        </Typography>
      ) : (
        <span className="text-ink/35 md:hidden">
          <ChevronIcon />
        </span>
      )}
    </>
  );
  const rowClass = cn(
    "min-h-[68px] items-center gap-3.5 border-ink/[0.07] px-4 py-3 not-first:border-t",
    "md:min-h-[54px] md:rounded-[10px] md:border-0 md:px-2.5 md:py-2 md:not-first:border-t-0",
    desktopOnly ? "hidden md:flex" : "flex",
  );

  if (!href) {
    return <div className={rowClass}>{content}</div>;
  }
  return (
    <Link
      href={localePath(locale, href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        rowClass,
        "hover:bg-burgundy/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-burgundy",
        active && "md:bg-leather",
      )}
    >
      {content}
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
const BagIcon = () => (
  <Icon>
    <path d="M5.5 8.5h13l-1 12h-11z" />
    <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
  </Icon>
);
const ChatIcon = () => (
  <Icon>
    <path d="M4.5 6.5h15v10h-9l-4 3v-3h-2z" />
  </Icon>
);
const ShieldIcon = () => (
  <Icon>
    <path d="M12 3.5 5.5 6v5.5c0 4.2 2.8 7.5 6.5 9 3.7-1.5 6.5-4.8 6.5-9V6z" />
  </Icon>
);
const BackIcon = () => (
  <Icon flip>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);
