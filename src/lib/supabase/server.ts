import "server-only";
import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import type { NextApiRequest, NextApiResponse } from "next";
import type { GetServerSidePropsContext } from "next";
import type { Database } from "./database.types";

type ReqRes =
  | { req: NextApiRequest; res: NextApiResponse }
  | Pick<GetServerSidePropsContext, "req" | "res">;

// Supabase client for API routes and getServerSideProps (Pages Router).
// For the signed-in user on the server: getServerSideProps and `pages/api`.
// For public data that the CDN may cache, use ./anon.ts (no cookies).
// Usage: `const supabase = createClient({ req, res })`
export function createClient({ req, res }: ReqRes) {
  return createServerClient<Database>(
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
