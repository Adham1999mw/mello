import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import TextField, { type TextFieldProps } from "./TextField";

// TextField for passwords, with a show/hide eye in the end slot.
// Use autoComplete="current-password" to sign in and "new-password" to create or change one.

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {open ? (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.5-.6 4.9-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      )}
    </svg>
  );
}

export default function PasswordField(props: Omit<TextFieldProps, "type" | "end" | "ltr">) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      ltr
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      end={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("auth.fields.hidePassword") : t("auth.fields.showPassword")}
          aria-pressed={visible}
          disabled={props.disabled}
          className="flex w-12 shrink-0 cursor-pointer items-center justify-center rounded-field text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-[6px] focus-visible:outline-burgundy"
        >
          <EyeIcon open={!visible} />
        </button>
      }
    />
  );
}
