import { MIN_PASSWORD_LENGTH } from "./index";

// Form helpers for the customer sign-in pages: phone formatting, password rules and the
// `?next=` redirect. Pure functions, no Supabase.

// ---------- phone ----------

/**
 * Any typed or pasted Egyptian mobile number -> its 10 national digits, without the leading 0.
 * Accepts Arabic and Persian digits, spaces, dashes, "0", "+20" and "0020".
 *   "٠١٠ ١٢٣٤ ٥٦٧٨" / "+20 10 1234 5678" / "00201012345678" -> "1012345678"
 */
export function phoneDigits(value: string): string {
  let digits = value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** "1012345678" -> "10 1234 5678" (also formats a partial number while typing). */
export function formatPhone(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 10)].filter(Boolean).join(" ");
}

/** 10 national digits of an Egyptian mobile: 10, 11, 12 or 15 + 8 digits. */
export function isValidPhoneDigits(digits: string): boolean {
  return /^1[0125]\d{8}$/.test(digits);
}

/** What signUp() and saveProfile() expect: "1012345678" -> "01012345678" (see isValidPhone). */
export function toLocalPhone(digits: string): string {
  return `0${digits}`;
}

// ---------- password ----------

export function passwordRules(value: string) {
  return {
    length: value.length >= MIN_PASSWORD_LENGTH,
    letter: /[A-Za-z؀-ۿ]/.test(value),
    number: /[0-9٠-٩]/.test(value),
  };
}

export function isPasswordOk(value: string): boolean {
  return Object.values(passwordRules(value)).every(Boolean);
}

// ---------- names ----------

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

// ---------- redirects ----------

/** A `?next=` value that is safe to redirect to: a path on this site ("/checkout/"), else null. */
export function safeNext(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  return raw;
}

// ---------- browser storage (best effort: private windows can block it) ----------

export const AUTH_STORAGE = {
  /** Where to go after Google brings her back to /account/. */
  next: "needle:auth-next",
  /** Email typed on one auth page, prefilled on the others. */
  email: "needle:auth-email",
  /** Sign-up step 1 (name and phone), so a reload on step 2 keeps it. Never the password. */
  signup: "needle:signup",
  /** localStorage: she chose "Add it at checkout" on the add-mobile screen, so don't ask again. */
  phoneSkip: "needle:phone-skip",
} as const;

export function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Storage blocked: the flow still works, it just won't remember across reloads.
  }
}

export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: she may be asked again next time.
  }
}
