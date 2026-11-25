import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { useAdminSession } from "@/lib/admin/session";
import LoginForm from "./LoginForm";

const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Frame for every /admin page: top bar, and a login gate. `children` only renders for a
 * logged-in admin. (The database checks this too, so hiding the UI is not the protection.)
 * Phone first: one column, sticky top bar, full-width actions.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-ivory text-ink">
      <Head>
        <title>{t("admin.title")}</title>
        {/* Keep the dashboard out of Google */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {isConfigured ? (
        <Gate>{children}</Gate>
      ) : (
        <div className="mx-auto max-w-xl px-4 py-10">
          <Alert severity="warning">{t("admin.errors.notConfigured")}</Alert>
        </div>
      )}
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { status, user, signIn, signOut } = useAdminSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label={t("admin.loading")}>
        <CircularProgress />
      </div>
    );
  }

  if (status !== "admin") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <h1 className="mb-6 font-display text-3xl text-burgundy">{t("admin.login.title")}</h1>
        {status === "notAdmin" && (
          <div className="mb-6 flex flex-col gap-3">
            <Alert severity="error">{t("admin.login.notAdmin")}</Alert>
            <p className="text-sm text-ink-muted" dir="ltr">{user?.email}</p>
            <Button variant="outlined" fullWidth onClick={signOut}>
              {t("admin.signOut")}
            </Button>
          </div>
        )}
        {status === "signedOut" && <LoginForm onSubmit={signIn} />}
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar onSignOut={signOut} />
      <main className="mx-auto w-full max-w-5xl px-4 pt-4 pb-16 md:px-8 md:pt-8">{children}</main>
    </>
  );
}

function TopBar({ onSignOut }: { onSignOut: () => void }) {
  const { t, locale } = useTranslation();
  const { pathname } = useRouter();
  const links = [
    { href: "/admin", label: t("admin.products"), active: pathname !== "/[locale]/admin/settings" },
    { href: "/admin/settings", label: t("admin.settingsShort"), active: pathname === "/[locale]/admin/settings" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-burgundy text-champagne shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2 md:px-8">
        <Link href={localePath(locale, "/admin")} className="flex min-h-11 items-center font-display text-xl">
          {t("admin.title")}
        </Link>
        <div className="flex items-center">
          <LanguageSwitcher className="text-champagne" />
          <Button size="small" onClick={onSignOut} sx={{ color: "secondary.main" }}>
            {t("admin.signOut")}
          </Button>
        </div>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 md:px-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={localePath(locale, link.href)}
            aria-current={link.active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm ${
              link.active ? "border-champagne" : "border-transparent opacity-75"
            }`}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href={localePath(locale)}
          className="ms-auto flex min-h-11 shrink-0 items-center px-3 text-sm opacity-75"
        >
          {t("admin.viewStore")}
        </Link>
      </nav>
    </header>
  );
}
