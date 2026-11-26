import type { ReactNode } from "react";
import { cn } from "@/components/ui";
import BrandPanel from "./BrandPanel";
import { useGuestOnly } from "./useGuestOnly";

// Shared frame of every sign-in page (sign up, sign in, forgot / reset password, add mobile).
// The site header, footer and tab bar are hidden on these pages (see components/layout/Layout).
//
// Phones (base): the burgundy brand band on top and an ivory sheet with 24px top corners sliding
// over it. From md: two halves, brand panel at the inline start, the form centred in the other half.
//
// Guests only: a signed-in customer is sent home (useGuestOnly). Until the session is known the
// form stays hidden, then fades in, so it never flashes for someone who is about to leave.
//
//   <AuthLayout closeHref={localePath(locale, "/")}>
//     <form>...</form>
//   </AuthLayout>

type AuthLayoutProps = {
  children: ReactNode;
  /** Where the close (X) button goes on phones: the page she came from, or home. */
  closeHref: string;
  /** Phone back button. Defaults to the browser's back. */
  onBack?: () => void;
};

export default function AuthLayout({ children, closeHref, onBack }: AuthLayoutProps) {
  const { ready } = useGuestOnly();
  return (
    <div className="grid min-h-dvh flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] bg-burgundy text-ink md:grid-cols-2 md:grid-rows-none">
      <BrandPanel closeHref={closeHref} onBack={onBack} />
      <main className="relative z-10 -mt-6 rounded-t-sheet bg-ivory px-5 pt-3.5 pb-[calc(44px+env(safe-area-inset-bottom,0px))] md:mt-0 md:grid md:place-items-center md:rounded-none md:px-14 md:py-16">
        <span aria-hidden="true" className="mx-auto mb-5 block h-1 w-10 rounded-full bg-ink/[0.14] md:hidden" />
        <div
          aria-busy={!ready}
          className={cn(
            "mx-auto w-full max-w-[400px] transition-opacity duration-300 motion-reduce:transition-none",
            ready ? "opacity-100" : "invisible opacity-0",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
