import type { ChangeEvent } from "react";
import { formatPhone, isValidPhoneDigits, phoneDigits } from "@/lib/auth/form";
import TextField, { type TextFieldProps } from "./TextField";

// Egyptian mobile number with a fixed +20 and the flag. The whole field is left to right, also in
// Arabic. She types only the 10 national digits; Arabic digits, spaces, a leading 0, +20 or 0020 are
// cleaned up, and the number is shown as "10 1234 5678".
//
// Controlled: `value` is the 10 digits ("1012345678"), `onChange` gets the 10 digits.
// Save it with toLocalPhone(digits) -> "01012345678" (the format src/lib/auth and the database use).
// With react-hook-form, wrap it in <Controller>.

function EgyptFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true" className="shrink-0 rounded-[3px] ring-[0.5px] ring-ink/20">
      <rect width="20" height="14" fill="#fff" />
      <rect width="20" height="4.67" fill="#CE1126" />
      <rect y="9.33" width="20" height="4.67" fill="#111" />
      <circle cx="10" cy="7" r="1.6" fill="#C09300" />
    </svg>
  );
}

type PhoneFieldProps = Omit<TextFieldProps, "type" | "prefix" | "ltr" | "value" | "onChange" | "valid"> & {
  value: string;
  onChange: (digits: string) => void;
};

export default function PhoneField({ value, onChange, error, ...props }: PhoneFieldProps) {
  return (
    <TextField
      {...props}
      error={error}
      type="tel"
      inputMode="tel"
      autoComplete={props.autoComplete ?? "tel-national"}
      placeholder={props.placeholder ?? "10 1234 5678"}
      ltr
      valid={isValidPhoneDigits(value)}
      value={formatPhone(value)}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(phoneDigits(e.target.value))}
      className={props.className}
      prefix={
        <span className="flex shrink-0 items-center gap-2 border-e border-ink/[0.14] ps-3.5 pe-3 text-base tabular-nums text-ink">
          <EgyptFlag />
          <span>+20</span>
        </span>
      }
    />
  );
}
