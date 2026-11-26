import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { Button, Typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { getDeliverySettings, saveDeliverySettings, type DeliverySettingsForm } from "@/lib/admin/api";
import { useAdminError } from "./useAdminError";

type DayKey = "cairo_days_min" | "cairo_days_max" | "other_days_min" | "other_days_max" | "exchange_days";

/** Delivery & returns for the whole store (the one row of store_settings). */
export default function DeliverySettings() {
  const { t } = useTranslation();
  const toMessage = useAdminError();
  const [form, setForm] = useState<DeliverySettingsForm | null>(null);
  const [savedForm, setSavedForm] = useState<DeliverySettingsForm | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getDeliverySettings()
      .then((data) => {
        if (!active) return;
        setForm(data);
        setSavedForm(data);
      })
      .catch((e) => active && setLoadError(toMessage(e)));
    return () => {
      active = false;
    };
  }, [toMessage]);

  if (loadError) return <Alert severity="error">{loadError}</Alert>;
  if (!form || !savedForm) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress />
      </div>
    );
  }

  const set = (patch: Partial<DeliverySettingsForm>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const daysChanged = (["cairo_days_min", "cairo_days_max", "other_days_min", "other_days_max", "exchange_days"] as const).some(
    (k) => form[k] !== savedForm[k],
  );
  const textChanged = form.delivery_ar !== savedForm.delivery_ar || form.delivery_en !== savedForm.delivery_en;
  const badRange = (min: string, max: string) => Number(max) < Number(min);
  const cairoBad = badRange(form.cairo_days_min, form.cairo_days_max);
  const otherBad = badRange(form.other_days_min, form.other_days_max);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form || cairoBad || otherBad) return;
    setSaveError(null);
    setSaving(true);
    try {
      await saveDeliverySettings(form);
      setSavedForm(form);
      setSaved(true);
    } catch (e) {
      setSaveError(toMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const dayField = (key: DayKey, label: string, error = false) => (
    <TextField
      label={label}
      value={form[key]}
      onChange={(e) => set({ [key]: e.target.value.replace(/\D/g, "").slice(0, 2) })}
      error={error}
      slotProps={{ htmlInput: { inputMode: "numeric", dir: "ltr" } }}
    />
  );

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Typography variant="h1" color="burgundy">
          {t("admin.delivery.title")}
        </Typography>
        <Typography variant="bodySm" color="muted">
          {t("admin.delivery.help")}
        </Typography>
      </div>

      <section className="flex flex-col gap-4 rounded-brand bg-white/60 p-4 shadow-sm md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label={t("admin.delivery.textAr")}
            value={form.delivery_ar}
            onChange={(e) => set({ delivery_ar: e.target.value })}
            multiline
            minRows={3}
            slotProps={{ htmlInput: { dir: "rtl" } }}
          />
          <TextField
            label={t("admin.delivery.textEn")}
            value={form.delivery_en}
            onChange={(e) => set({ delivery_en: e.target.value })}
            multiline
            minRows={3}
            slotProps={{ htmlInput: { dir: "ltr" } }}
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <Typography variant="subtitle" as="legend" className="mb-2">
            {t("admin.delivery.cairo")}
          </Typography>
          <div className="grid grid-cols-2 gap-3 md:max-w-md">
            {dayField("cairo_days_min", t("admin.delivery.daysFrom"))}
            {dayField("cairo_days_max", t("admin.delivery.daysTo"), cairoBad)}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <Typography variant="subtitle" as="legend" className="mb-2">
            {t("admin.delivery.other")}
          </Typography>
          <div className="grid grid-cols-2 gap-3 md:max-w-md">
            {dayField("other_days_min", t("admin.delivery.daysFrom"))}
            {dayField("other_days_max", t("admin.delivery.daysTo"), otherBad)}
          </div>
        </fieldset>

        {(cairoBad || otherBad) && <Alert severity="error">{t("admin.delivery.invalidDays")}</Alert>}

        <div className="grid gap-4 md:grid-cols-2">
          {dayField("exchange_days", t("admin.delivery.exchangeDays"))}
          <TextField
            label={t("admin.delivery.freeShipping")}
            value={form.free_shipping_threshold}
            onChange={(e) => set({ free_shipping_threshold: e.target.value.replace(/[^\d.]/g, "") })}
            helperText={t("admin.delivery.freeShippingHelp")}
            slotProps={{ htmlInput: { inputMode: "decimal", dir: "ltr" } }}
          />
        </div>

        <FormControlLabel
          control={<Switch checked={form.cod_enabled} onChange={(e) => set({ cod_enabled: e.target.checked })} />}
          label={t("admin.delivery.cod")}
          sx={{ minHeight: 44, m: 0 }}
        />

        {daysChanged && !textChanged && <Alert severity="info">{t("admin.delivery.textMismatch")}</Alert>}
      </section>

      <div className="sticky bottom-0 z-30 -mx-4 flex flex-col gap-2 border-t border-ink/10 bg-ivory/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:flex-row-reverse md:border-0 md:bg-transparent md:px-0">
        {saveError && <Alert severity="error" className="md:flex-1">{saveError}</Alert>}
        <Button type="submit" fullWidth="mobile" disabled={saving || !dirty || cairoBad || otherBad}>
          {saving ? t("admin.form.saving") : t("admin.delivery.save")}
        </Button>
      </div>

      <Snackbar open={saved} autoHideDuration={2500} onClose={() => setSaved(false)} message={t("admin.delivery.saved")} />
    </form>
  );
}
