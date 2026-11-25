import { useRouter } from "next/router";
import { isHomePage } from "@/i18n/static";
import BottomNav from "./BottomNav";
import Header from "./Header";

// Shared frame for every page: the site header on top, the page content, and on phones
// the bottom tab bar. Used once in _app.tsx, so pages only render their own content.
// On the homepage the header floats over the burgundy hero, as in the approved design.
export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const isHome = isHomePage(pathname);

  // The admin dashboard has its own top bar (see components/admin/AdminShell).
  if (pathname.startsWith("/[locale]/admin")) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen flex-col bg-ivory text-ink">
      <Header overlay={isHome} />
      {/* On phones, leave room at the bottom so the tab bar never covers the last content */}
      <main className="flex-1 pb-[76px] md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
