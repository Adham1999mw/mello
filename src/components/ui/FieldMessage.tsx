import type { ReactNode } from "react";
import { cn } from "./cn";

// The line under a form field: a hint, an error or a success message.
// Errors and successes start with an icon, so the meaning never depends on color alone.

export type FieldMessageTone = "hint" | "error" | "success";

const TONES: Record<FieldMessageTone, string> = {
  hint: "text-ink-muted",
  error: "text-danger",
  success: "text-success",
};

export function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type FieldMessageProps = {
  id?: string;
  tone?: FieldMessageTone;
  children: ReactNode;
  className?: string;
};

export default function FieldMessage({ id, tone = "hint", children, className }: FieldMessageProps) {
  return (
    <p id={id} className={cn("flex items-start gap-[7px] text-[13.5px] leading-[1.45]", TONES[tone], className)}>
      {tone === "error" && (
        <span className="mt-0.5 flex shrink-0">
          <AlertIcon />
        </span>
      )}
      {tone === "success" && (
        <span className="mt-0.5 flex shrink-0">
          <CheckIcon />
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </p>
  );
}
