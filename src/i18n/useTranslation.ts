import { useCallback } from "react";
import { getDirection } from "./config";
import { useLocale } from "./useLocale";
import ar from "./messages/ar";
import en, { type Messages } from "./messages/en";

const dictionaries = { ar, en } satisfies Record<string, Messages>;

// Dot-separated paths to every string in the messages object, e.g. "home.title".
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];
export type MessageKey = Paths<Messages>;

/**
 * Returns a typed `t("home.title")` function for the current route locale.
 * `{name}` placeholders are replaced from `vars`.
 */
export function useTranslation() {
  const locale = useLocale();
  const messages = dictionaries[locale];

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const value = key
        .split(".")
        .reduce<unknown>((obj, part) => (obj as Record<string, unknown>)?.[part], messages);
      if (typeof value !== "string") return key;
      return vars
        ? value.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`))
        : value;
    },
    [messages],
  );

  return { t, locale, dir: getDirection(locale) };
}
