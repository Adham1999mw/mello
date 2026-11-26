import type { ReactNode } from "react";
import Link from "next/link";
import { AlertIcon, Button, SegmentedTabs, cn, typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { GoogleIcon, Spinner } from "./AuthIcons";
import type { AuthTab } from "./useAuthPage";

// Small shared pieces of the sign-in pages.

/** Round leather badge with a line icon, above the title of success and "check your email" screens. */
export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="grid size-16 place-items-center rounded-full bg-leather text-burgundy">
      {children}
    </div>
  );
}

/** Leather strip with an avatar letter, a name, one detail line and an optional action. */
export function AccountSummary({ name, detail, action }: { name: string; detail: string; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-field bg-leather py-2.5 ps-3.5 pe-2">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-burgundy font-display text-lg text-champagne">
        {name.trim().charAt(0)}
      </span>
      <span className="grid min-w-0 flex-1">
        <span className="truncate">{name}</span>
        <bdi dir="ltr" className="truncate text-start text-[12.5px] text-ink-muted">
          {detail}
        </bdi>
      </span>
      {action}
    </div>
  );
}

/** An error that isn't about one field (network, rate limit). Announced when it appears. */
export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-field bg-danger/[0.07] px-3.5 py-3 text-sm text-danger">
      <span className="mt-0.5 flex shrink-0">
        <AlertIcon />
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

/** "or with email" divider between Google and the form. */
export function OrDivider() {
  const { t } = useTranslation();
  return (
    <p className="grid grid-cols-[1fr_auto_1fr] items-center gap-3.5 text-[13px] text-ink-muted before:h-px before:bg-current before:opacity-30 after:h-px after:bg-current after:opacity-30">
      {t("auth.orEmail")}
    </p>
  );
}

/** Continue with Google: white, rounded like the fields, sentence-case label. */
export function GoogleButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading || undefined}
      // The one button that isn't a <Button>: Google's brand rules need a white fill and a
      // sentence-case label, so it takes the field-button frame and swaps the text style.
      className={cn(
        "inline-flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-field border border-ink/[0.18] bg-white px-5 text-ink",
        "transition-colors duration-200 hover:border-ink/[0.36] disabled:pointer-events-none disabled:opacity-60",
        "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink",
        typography("body"),
      )}
    >
      {loading ? <Spinner /> : <GoogleIcon />}
      {t("auth.google")}
    </button>
  );
}

/** Submit button with the loading spinner. */
export function SubmitButton({ loading, children }: { loading?: boolean; children: ReactNode }) {
  return (
    <Button type="submit" shape="field" fullWidth disabled={loading} aria-busy={loading || undefined} startIcon={loading ? <Spinner /> : undefined}>
      {children}
    </Button>
  );
}

/** Ids that tie each tab to its panel (aria-controls / aria-labelledby). */
export const AUTH_TAB_IDS = {
  signIn: { tab: "tab-sign-in", panel: "panel-sign-in" },
  signUp: { tab: "tab-sign-up", panel: "panel-sign-up" },
} as const;

/** The rounded "Sign in | Create account" tabs at the top of the sign-in page. */
export function AuthTabs({ current, onSelect }: { current: AuthTab; onSelect: (tab: AuthTab) => void }) {
  const { t } = useTranslation();
  const tabs: AuthTab[] = ["signIn", "signUp"];
  return (
    <SegmentedTabs
      label={t("auth.tabsLabel")}
      items={tabs.map((tab) => ({
        label: t(`auth.tabs.${tab}`),
        current: current === tab,
        onSelect: () => onSelect(tab),
        id: AUTH_TAB_IDS[tab].tab,
        controls: AUTH_TAB_IDS[tab].panel,
      }))}
    />
  );
}

/** A text link 44px tall, for "Back to sign in" and similar. */
export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        typography("bodySm"),
        "inline-flex min-h-11 items-center font-medium text-burgundy underline decoration-burgundy/40 underline-offset-4 hover:decoration-burgundy",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy",
      )}
    >
      {children}
    </Link>
  );
}
