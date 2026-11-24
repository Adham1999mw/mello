import "server-only";
import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import type { NextApiRequest, NextApiResponse } from "next";
import type { GetServerSidePropsContext } from "next";

type ReqRes =
  | { req: NextApiRequest; res: NextApiResponse }
  | Pick<GetServerSidePropsContext, "req" | "res">;

// Supabase client for API routes and getServerSideProps (Pages Router).
// NOTE: unused while the site is a static export on GitHub Pages (no server). Kept for
// when the store moves to a host with a server; use ./client.ts in the meantime.
// Usage: `const supabase = createClient({ req, res })`
export function createClient({ req, res }: ReqRes) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookiesToSet) {
          res.setHeader(
            "Set-Cookie",
            cookiesToSet.map(({ name, value, options }) =>
              serializeCookieHeader(name, value, options),
            ),
          );
        },
      },
    },
  );
}
