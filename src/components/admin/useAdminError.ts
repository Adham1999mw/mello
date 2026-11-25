import { useCallback } from "react";
import { errorKey } from "@/lib/admin/api";
import { useTranslation } from "@/i18n/useTranslation";

/** Turns any Supabase error into a translated, human message. */
export function useAdminError() {
  const { t } = useTranslation();
  return useCallback((error: unknown) => t(`admin.errors.${errorKey(error)}`), [t]);
}
