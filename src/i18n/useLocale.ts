import { useRouter } from "next/router";
import { toLocale } from "./config";

// Current locale from the `[locale]` route segment; pages outside it (like `/`) are Arabic.
export function useLocale() {
  const { query } = useRouter();
  return toLocale(typeof query.locale === "string" ? query.locale : undefined);
}
