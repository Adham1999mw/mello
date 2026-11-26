import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import FieldMessage, { CheckIcon } from "./FieldMessage";
import { cn } from "./cn";

// Needle form field: label on top, a 54px rounded box, an optional prefix (+20) and end slot
// (eye toggle, valid check), and one message line (hint, error or success) under it.
// Every input in the store uses this (sign in, checkout, account). Live examples: /ar/design-system/.
//
//   <TextField label={t("auth.fields.email")} type="email" ltr error={errors.email?.message} {...register("email")} />
//
// Works with react-hook-form's `register()` (the `ref` goes to the <input>). Mobile first: the text is
// 16px so iOS doesn't zoom, and the box fills the width of its column.

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> & {
  label: string;
  /** Shows "Optional" on the label row. Required is the default, so there is no asterisk. */
  optional?: boolean;
  hint?: ReactNode;
  /** Error text. Also sets the error look and aria-invalid. */
  error?: ReactNode;
  /** Error look and aria-invalid without a message (when one banner explains several fields). */
  invalid?: boolean;
  /** Success text under the field (e.g. "Passwords match"). */
  success?: ReactNode;
  /** Shows a green check in the end slot. */
  valid?: boolean;
  /** Content before the input, e.g. the +20 of PhoneField. */
  prefix?: ReactNode;
  /** Content after the input, e.g. PasswordField's eye button (48px wide slot). */
  end?: ReactNode;
  /** Left-to-right value (email, password, phone) inside the Arabic layout. */
  ltr?: boolean;
  ref?: Ref<HTMLInputElement>;
  /** Layout only (margins, grid placement). */
  className?: string;
};

export default function TextField({
  label,
  optional,
  hint,
  error,
  invalid: invalidProp,
  success,
  valid,
  prefix,
  end,
  ltr,
  id,
  className,
  disabled,
  readOnly,
  ref,
  ...inputProps
}: TextFieldProps) {
  const { t, dir } = useTranslation();
  const autoId = useId();
  const inputId = id ?? autoId;
  const message = error ?? success ?? hint;
  const messageId = message ? `${inputId}-msg` : undefined;
  const invalid = Boolean(error) || Boolean(invalidProp);

  return (
    <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2", className)}>
      <label htmlFor={inputId} className="flex justify-between gap-2 text-sm font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="font-normal text-ink-muted">{t("auth.fields.optional")}</span>}
      </label>

      <div
        dir={ltr ? "ltr" : undefined}
        className={cn(
          "relative flex min-h-[54px] min-w-0 items-stretch rounded-field border",
          "transition-[border-color,box-shadow,background-color] duration-150",
          readOnly
            ? "border-transparent bg-leather"
            : disabled
              ? "border-ink/10 bg-ink/[0.04]"
              : invalid
                ? "border-danger bg-danger/[0.03] focus-within:ring-4 focus-within:ring-danger/12"
                : "border-ink/[0.18] bg-white hover:border-ink/[0.36] focus-within:border-burgundy focus-within:ring-4 focus-within:ring-burgundy/10",
        )}
      >
        {prefix}
        <input
          ref={ref}
          id={inputId}
          dir={ltr ? "ltr" : undefined}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={messageId}
          className={cn(
            "w-full min-w-0 flex-1 rounded-[inherit] bg-transparent px-4 text-base text-ink outline-none",
            "placeholder:text-ink-muted/60 disabled:cursor-not-allowed disabled:text-ink/45",
            // An LTR value in the Arabic layout lines up with the right-aligned label.
            ltr && dir === "rtl" && "text-right",
          )}
          {...inputProps}
        />
        {end}
        {!end && valid && !invalid && (
          <span className="flex w-11 shrink-0 items-center justify-center text-success" aria-hidden="true">
            <CheckIcon />
          </span>
        )}
      </div>

      {message && (
        <FieldMessage id={messageId} tone={error ? "error" : success ? "success" : "hint"}>
          {message}
        </FieldMessage>
      )}
    </div>
  );
}
