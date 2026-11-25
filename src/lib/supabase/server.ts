import "server-only";
import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import type { NextApiRequest, NextApiResponse } from "next";
import type { GetServerSidePropsContext } from "next";
import type { Database } from "./database.types";

type ReqRes =
  | { req: NextApiRequest; res: NextApiResponse }
  | Pick<GetServerSidePropsContext, "req" | "res">;

// Supabase client for API routes and getServerSideProps (Pages Router).
// Works on the real server only: use it in `*.server.tsx` pages and in `pages/api`.
// (On GitHub Pages there is no server; there, pages call ./client.ts from the browser.)
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
