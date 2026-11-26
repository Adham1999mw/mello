import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { CARE_ICONS, type AdminSize, type SpecsForm } from "@/lib/admin/api";

export type SpecsErrors = Partial<Record<"fabric_weight_gsm" | "model_height_cm", string>>;

/** Checks the number fields. Returns translated messages per field. */
export function validateSpecs(specs: SpecsForm, t: ReturnType<typeof useTranslation>["t"]): SpecsErrors {
  const errors: SpecsErrors = {};
  const inRange = (value: string, min: number, max: number) => {
    if (value.trim() === "") return true;
    const n = Number(value);
    return Number.isInteger(n) && n >= min && n <= max;
  };
  if (!inRange(specs.fabric_weight_gsm, 1, 2000)) errors.fabric_weight_gsm = t("admin.specs.invalidWeight");
  if (!inRange(specs.model_height_cm, 120, 220)) errors.model_height_cm = t("admin.specs.invalidHeight");
  return errors;
}

/**
 * "Fabric, care & fit" fields of a product: fabric, weight, origin, care text and symbols,
 * the model's height and size, and an optional delivery note. Phone first: one column,
 * Arabic and English side by side from md.
 */
export default function SpecsEditor({
  specs,
  sizes,
  errors,
  onChange,
}: {
  specs: SpecsForm;
  sizes: AdminSize[];
  errors: SpecsErrors;
  onChange: (specs: SpecsForm) => void;
}) {
  const { t, locale } = useTranslation();
  const set = (patch: Partial<SpecsForm>) => onChange({ ...specs, ...patch });
  const digits = (value: string) => value.replace(/\D/g, "").slice(0, 4);

  const toggleIcon = (icon: SpecsForm["care_icons"][number]) =>
    set({
      care_icons: specs.care_icons.includes(icon)
        ? specs.care_icons.filter((i) => i !== icon)
        : CARE_ICONS.filter((i) => i === icon || specs.care_icons.includes(i)),
    });

  return (
    <div className="flex flex-col gap-4">
      <Typography variant="bodySm" color="muted">
        {t("admin.specs.help")}
      </Typography>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={t("admin.specs.fabricAr")}
          value={specs.fabric_ar}
          onChange={(e) => set({ fabric_ar: e.target.value })}
          helperText={t("admin.specs.fabricHelp")}
          slotProps={{ htmlInput: { dir: "rtl" } }}
        />
        <TextField
          label={t("admin.specs.fabricEn")}
          value={specs.fabric_en}
          onChange={(e) => set({ fabric_en: e.target.value })}
          slotProps={{ htmlInput: { dir: "ltr" } }}
        />
        <TextField
          label={t("admin.specs.weight")}
          value={specs.fabric_weight_gsm}
          onChange={(e) => set({ fabric_weight_gsm: digits(e.target.value) })}
          error={Boolean(errors.fabric_weight_gsm)}
          helperText={errors.fabric_weight_gsm}
          slotProps={{ htmlInput: { inputMode: "numeric", dir: "ltr" } }}
        />
        <div className="hidden md:block" />
        <TextField
          label={t("admin.specs.originAr")}
          value={specs.origin_ar}
          onChange={(e) => set({ origin_ar: e.target.value })}
          slotProps={{ htmlInput: { dir: "rtl" } }}
        />
        <TextField
          label={t("admin.specs.originEn")}
          value={specs.origin_en}
          onChange={(e) => set({ origin_en: e.target.value })}
          slotProps={{ htmlInput: { dir: "ltr" } }}
        />
        <TextField
          label={t("admin.specs.careAr")}
          value={specs.care_ar}
          onChange={(e) => set({ care_ar: e.target.value })}
          multiline
          minRows={2}
          slotProps={{ htmlInput: { dir: "rtl" } }}
        />
        <TextField
          label={t("admin.specs.careEn")}
          value={specs.care_en}
          onChange={(e) => set({ care_en: e.target.value })}
          multiline
          minRows={2}
          slotProps={{ htmlInput: { dir: "ltr" } }}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <Typography variant="subtitle" as="legend" className="mb-2">
          {t("admin.specs.careIcons")}
        </Typography>
        <div className="flex flex-wrap gap-2">
          {CARE_ICONS.map((icon) => {
            const on = specs.care_icons.includes(icon);
            return (
              <Chip
                key={icon}
                label={t(`product.careIcons.${icon}`)}
                color={on ? "primary" : "default"}
                variant={on ? "filled" : "outlined"}
                onClick={() => toggleIcon(icon)}
                aria-pressed={on}
                sx={{ minHeight: 44, borderRadius: 999 }}
              />
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label={t("admin.specs.modelHeight")}
          value={specs.model_height_cm}
          onChange={(e) => set({ model_height_cm: digits(e.target.value) })}
          error={Boolean(errors.model_height_cm)}
          helperText={errors.model_height_cm ?? t("admin.specs.modelHelp")}
          slotProps={{ htmlInput: { inputMode: "numeric", dir: "ltr" } }}
        />
        <TextField
          select
          label={t("admin.specs.modelSize")}
          value={specs.model_size_code}
          onChange={(e) => set({ model_size_code: e.target.value })}
        >
          <MenuItem value="">{t("admin.specs.noSize")}</MenuItem>
          {sizes.map((s) => (
            <MenuItem key={s.id} value={s.code}>
              {locale === "en" ? s.name_en : s.name_ar}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t("admin.specs.deliveryNoteAr")}
          value={specs.delivery_note_ar}
          onChange={(e) => set({ delivery_note_ar: e.target.value })}
          helperText={t("admin.specs.deliveryNoteHelp")}
          multiline
          minRows={2}
          slotProps={{ htmlInput: { dir: "rtl" } }}
        />
        <TextField
          label={t("admin.specs.deliveryNoteEn")}
          value={specs.delivery_note_en}
          onChange={(e) => set({ delivery_note_en: e.target.value })}
          multiline
          minRows={2}
          slotProps={{ htmlInput: { dir: "ltr" } }}
        />
      </div>
    </div>
  );
}
