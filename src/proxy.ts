import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SIGNED_IN_HOME, isResetLink } from "@/lib/auth/guestOnly";

// Next.js Proxy (formerly "middleware"): runs on the server before a page loads.
//
// What it does: a signed-in customer who opens a sign-in page (sign in / create account,
// forgot password, reset password) is redirected to the home page. Rules: src/lib/auth/guestOnly.ts.

export async function proxy(request: NextRequest) {
  const [, locale, page] = request.nextUrl.pathname.split("/");
  if (isResetLink(page, request.nextUrl.searchParams)) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      // Supabase may refresh an expired session here; pass the new cookies on to the browser.
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims() checks the session's signature (not just whether a cookie exists).
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return response;

  const home = request.nextUrl.clone();
  home.pathname = `/${locale}${SIGNED_IN_HOME}`;
  home.search = "";
  const redirect = NextResponse.redirect(home);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

// Only the sign-in pages, in both languages (keep in step with GUEST_ONLY_PAGES; Next needs
// literal values here).
export const config = {
  matcher: ["/:locale(ar|en)/:page(sign-in|forgot-password|reset-password)/:rest*"],
};
