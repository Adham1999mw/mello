import { useTranslation } from "@/i18n/useTranslation";
import { passwordRules } from "@/lib/auth/form";
import { CheckIcon } from "./FieldMessage";
import { cn } from "./cn";

// Three chips under a new password (8+ characters, a letter, a number) that turn green as she types.
export default function PasswordRules({ value, className }: { value: string; className?: string }) {
  const { t } = useTranslation();
  const rules = passwordRules(value);
  const items = [
    { met: rules.length, label: t("auth.rules.length") },
    { met: rules.letter, label: t("auth.rules.letter") },
    { met: rules.number, label: t("auth.rules.number") },
  ];
  const met = items.filter((i) => i.met).length;

  return (
    <div className={className}>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item.label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full py-1 ps-2 pe-2.5 text-[12.5px] transition-colors",
              item.met ? "bg-success/10 text-success" : "bg-ink/5 text-ink-muted",
            )}
          >
            <span className={cn("flex", !item.met && "opacity-35")}>
              <CheckIcon size={14} />
            </span>
            {item.label}
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {t("auth.rules.summary", { met })}
      </p>
    </div>
  );
}
