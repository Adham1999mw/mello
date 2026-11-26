import { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { takePendingToast, toast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { fetchProfile, firstName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useAppDispatch } from "./hooks";
import { profileFailed, profileLoaded, sessionChanged, type CustomerUser } from "./authSlice";

// Keeps the `auth` slice in step with Supabase: on load, after sign-in / sign-up / Google,
// on sign-out, on token refresh, and when another tab signs in or out. Mounted once in StoreProvider.

function toCustomerUser(user: User): CustomerUser {
  return { id: user.id, email: user.email ?? null, provider: user.app_metadata.provider ?? null };
}

export default function AuthListener() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  // The listener is set up once; read the current language through a ref.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let loadedFor: string | null = null;

    async function loadProfile(userId: string) {
      try {
        const profile = await fetchProfile(userId);
        if (active) dispatch(profileLoaded(profile));
      } catch {
        if (active) dispatch(profileFailed());
      }
    }

    // Fires INITIAL_SESSION first (after a Google / email-link `?code=` is exchanged), then on
    // every change. Supabase warns against awaiting its own calls inside this callback, so the
    // profile is fetched on the next tick.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const user = session?.user ?? null;
      dispatch(sessionChanged(user ? toCustomerUser(user) : null));
      if (user && loadedFor !== user.id) {
        loadedFor = user.id;
        setTimeout(() => loadProfile(user.id), 0);
      }
      if (!user) loadedFor = null;
      // Back from Google: SignInForm / SignUpForm left a note before the redirect.
      if (user && takePendingToast() === "google") {
        const name = firstName(user.user_metadata?.full_name ?? user.user_metadata?.name);
        const tr = tRef.current;
        toast.success({
          title: name ? tr("auth.toast.signedIn.title", { name }) : tr("auth.toast.signedIn.titleNoName"),
          message: tr("auth.toast.signedIn.message"),
        });
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}
