import { useCallback, useEffect, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/i18n/static";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

// Customer accounts (sign up, sign in, Google, forgot / reset password): the client side of
// supabase/migrations/20261127000000_customers.sql. Browser only, so it works on GitHub Pages too.
// The pages that use it come later. Supabase + Google setup: docs/customer-accounts.md.
//
// Admin access is separate: it needs a row in public.admins, which customers can't add.
// See src/lib/admin/session.ts and supabase/migrations/20261127000000_customers.sql.

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Full address of a page on this site, for Supabase redirects (works under /mello on Pages). */
export function siteUrl(locale: Locale, path: string): string {
  return `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${localePath(locale, path)}`;
}

// ---------- form helpers ----------

export const MIN_PASSWORD_LENGTH = 8;

/** "٠١٠ ١٢٣٤ ٥٦٧٨" or "+20 10 1234 5678" -> "01012345678". */
export function normalizePhone(value: string): string {
  let digits = value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("20") && digits.length === 12) digits = `0${digits.slice(2)}`;
  return digits;
}

/** Egyptian mobile number: 010, 011, 012 or 015 + 8 digits. Same rule as the database. */
export function isValidPhone(phone: string): boolean {
  return /^01[0125][0-9]{8}$/.test(phone);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** What went wrong, for the page to pick a message (put the texts in the i18n messages). */
export type AuthErrorReason =
  | "invalidCredentials"
  | "emailTaken"
  | "weakPassword"
  | "samePassword"
  | "emailNotConfirmed"
  | "signupDisabled"
  | "rateLimited"
  | "invalidEmail"
  | "invalidPhone"
  | "linkExpired"
  | "generic";

export function authErrorReason(error: unknown): AuthErrorReason {
  const code = (error as AuthError | null)?.code;
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "user_already_exists":
    case "email_exists":
      return "emailTaken";
    case "weak_password":
      return "weakPassword";
    case "same_password":
      return "samePassword";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "signup_disabled":
    case "email_provider_disabled":
      return "signupDisabled";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rateLimited";
    case "invalid_phone":
      return "invalidPhone";
    case "validation_failed":
    case "email_address_invalid":
      return "invalidEmail";
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
    case "bad_code_verifier":
      return "linkExpired";
    default:
      return "generic";
  }
}

// ---------- actions ----------

/**
 * Email + password sign-up. The phone is required here (Google sign-ups have none; they give it
 * at checkout or on the account page). It is normalized first, so "٠١٠ ١٢٣٤ ٥٦٧٨" is fine.
 * A bad phone throws `invalid_phone` (authErrorReason -> "invalidPhone") before anything is sent.
 *
 * With "Confirm email" off in Supabase the customer is signed in
 * right away (`signedIn: true`). If you turn it on later, no code change is needed: Supabase
 * sends a confirmation link and the page shows "check your email" (`signedIn: false`).
 */
export async function signUp(
  locale: Locale,
  input: { fullName: string; email: string; password: string; phone: string },
): Promise<{ signedIn: boolean }> {
  const phone = normalizePhone(input.phone);
  if (!isValidPhone(phone)) {
    throw Object.assign(new Error("invalid phone"), { code: "invalid_phone" });
  }
  const { data, error } = await createClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      // Read by the handle_new_user() trigger to fill public.profiles.
      data: { full_name: input.fullName, phone },
      emailRedirectTo: siteUrl(locale, "/account"),
    },
  });
  if (error) throw error;
  // With confirmation on, an email that already has an account comes back with no identities.
  if (data.user && data.user.identities?.length === 0) {
    throw Object.assign(new Error("email exists"), { code: "user_already_exists" });
  }
  return { signedIn: Boolean(data.session) };
}

export async function signIn(email: string, password: string) {
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Sign in or sign up with Google (same button). Leaves the page; Google sends them back to /account/. */
export async function signInWithGoogle(locale: Locale) {
  const { error } = await createClient().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: siteUrl(locale, "/account"),
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}

/** Forgot password: the only email the store sends. The link opens /reset-password/. */
export async function sendPasswordReset(locale: Locale, email: string) {
  const { error } = await createClient().auth.resetPasswordForEmail(email, {
    redirectTo: siteUrl(locale, "/reset-password"),
  });
  if (error) throw error;
}

/**
 * On /reset-password/: signs the customer in from the email link, so they can choose a new password.
 * Accepts both kinds of link:
 *   ?token_hash=...&type=recovery  our email template (docs/customer-accounts.md). Works even when the
 *                                  email is opened in another browser or in the Gmail app.
 *   ?code=...                      Supabase's default link. The client finishes it by itself, but only
 *                                  in the same browser that asked for the reset.
 * Returns false when the link is expired or already used.
 */
export async function verifyRecoveryLink(url: URL = new URL(window.location.href)): Promise<boolean> {
  const supabase = createClient();
  const hash = new URLSearchParams(url.hash.slice(1));
  if (url.searchParams.get("error") || hash.get("error")) return false;

  const tokenHash = url.searchParams.get("token_hash");
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    return !error;
  }
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

/** Sets a new password for the signed-in customer (after verifyRecoveryLink, or from the account page). */
export async function updatePassword(password: string) {
  const { error } = await createClient().auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  await createClient().auth.signOut();
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await createClient().from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(userId: string, changes: { full_name?: string | null; phone?: string | null }) {
  const { error } = await createClient().from("profiles").update(changes).eq("id", userId);
  if (error) throw error;
}

// ---------- session hook ----------

export type CustomerStatus = "loading" | "signedOut" | "signedIn";

/** The signed-in customer, kept up to date when they sign in or out (also in other tabs). */
export function useCustomerSession() {
  const [status, setStatus] = useState<CustomerStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  const apply = useCallback((next: User | null) => {
    setUser(next);
    setStatus(next ? "signedIn" : "signedOut");
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    // getSession() also finishes a Google / email-link sign-in from the `?code=` in the URL.
    supabase.auth.getSession().then(({ data }) => {
      if (active) apply(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) apply(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [apply]);

  return { status, user };
}
