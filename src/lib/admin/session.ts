import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Login state for the admin dashboard. Runs in the browser only (works on GitHub Pages).
 *
 * - "loading":  checking the saved session
 * - "signedOut": show the login form
 * - "notAdmin": logged in, but this user is not in public.admins
 * - "admin":    full access
 *
 * The real protection is in the database (RLS + is_admin()); this only decides what to show.
 */
export type AdminStatus = "loading" | "signedOut" | "notAdmin" | "admin";

export function useAdminSession() {
  const [status, setStatus] = useState<AdminStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  const check = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) {
      setStatus("signedOut");
      return;
    }
    const { data, error } = await createClient().rpc("is_admin");
    setStatus(!error && data ? "admin" : "notAdmin");
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) check(data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") check(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [check]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
  }, []);

  return { status, user, signIn, signOut };
}
