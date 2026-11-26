import { useRouter } from "next/router";
import { isHomePage } from "@/i18n/static";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import Header from "./Header";

// Shared frame for every page: the site header on top, the page content, the footer, and on
// phones the bottom tab bar. Used once in _app.tsx, so pages only render their own content.
// On the homepage the header floats over the burgundy hero, as in the approved design.
export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const isHome = isHomePage(pathname);

  // The admin dashboard has its own top bar (see components/admin/AdminShell).
  if (pathname.startsWith("/[locale]/admin")) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen flex-col bg-ivory text-ink">
      <Header overlay={isHome} />
      <main className="flex-1">{children}</main>
      {/* The footer leaves room at its bottom on phones so the tab bar never covers it */}
      <Footer />
      <BottomNav />
    </div>
  );
}
