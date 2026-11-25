import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { useTranslation } from "@/i18n/useTranslation";
import type { AdminColor, AdminSize, VariantForm } from "@/lib/admin/api";

export type VariantErrors = Record<string, { price?: string; compare?: string; sku?: string }>;
export const variantKey = (v: Pick<VariantForm, "color_id" | "size_id">) => `${v.color_id}-${v.size_id}`;

type Props = {
  slug: string;
  colors: AdminColor[];
  sizes: AdminSize[];
  variants: VariantForm[];
  onChange: (variants: VariantForm[]) => void;
  errors: VariantErrors;
};

/**
 * Pick colors and sizes; every color × size becomes a variant with its own price and stock.
 * Turning a color off and on again brings back what you typed for it.
 */
export default function VariantsEditor({ slug, colors, sizes, variants, onChange, errors }: Props) {
  const { t, locale } = useTranslation();
  const [colorIds, setColorIds] = useState(() => unique(variants.map((v) => v.color_id)));
  const [sizeIds, setSizeIds] = useState(() => unique(variants.map((v) => v.size_id)));
  const [fillPrice, setFillPrice] = useState("");
  const [fillStock, setFillStock] = useState("");
  const removed = useRef(new Map<string, VariantForm>());

  const name = (row: { name_ar: string; name_en: string }) => (locale === "en" ? row.name_en : row.name_ar);

  function rebuild(nextColors: number[], nextSizes: number[]) {
    const current = new Map(variants.map((v) => [variantKey(v), v]));
    const basePrice = variants[0]?.price ?? "";
    const next: VariantForm[] = [];
    // Keep the order of the colors and sizes lists (S, M, L...), not the click order.
    for (const color of colors.filter((c) => nextColors.includes(c.id))) {
      for (const size of sizes.filter((s) => nextSizes.includes(s.id))) {
        const key = `${color.id}-${size.id}`;
        next.push(
          current.get(key) ??
            removed.current.get(key) ?? {
              color_id: color.id,
              size_id: size.id,
              sku: `${slug || "product"}-${color.slug}-${size.code}`.toUpperCase(),
              price: basePrice,
              compare_at_price: "",
              stock: "0",
              is_active: true,
            },
        );
      }
    }
    for (const [key, v] of current) if (!next.some((n) => variantKey(n) === key)) removed.current.set(key, v);
    onChange(next);
  }

  function toggle(list: number[], id: number) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function update(key: string, patch: Partial<VariantForm>) {
    onChange(variants.map((v) => (variantKey(v) === key ? { ...v, ...patch } : v)));
  }

  function applyToAll() {
    onChange(
      variants.map((v) => ({
        ...v,
        ...(fillPrice !== "" ? { price: fillPrice } : {}),
        ...(fillStock !== "" ? { stock: fillStock } : {}),
      })),
    );
  }

  if (colors.length === 0 || sizes.length === 0) {
    return <p className="text-ink-muted">{t("admin.form.noOptions")}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-ink-muted">{t("admin.form.variantsHelp")}</p>

      <fieldset>
        <legend className="mb-2 font-medium">{t("admin.form.colors")}</legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const on = colorIds.includes(c.id);
            return (
              <Chip
                key={c.id}
                label={name(c)}
                onClick={() => {
                  const next = toggle(colorIds, c.id);
                  setColorIds(next);
                  rebuild(next, sizeIds);
                }}
                color={on ? "primary" : "default"}
                variant={on ? "filled" : "outlined"}
                aria-pressed={on}
                icon={<Swatch hex={c.hex} />}
                sx={{ minHeight: 44, borderRadius: 22, px: 0.5 }}
              />
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-medium">{t("admin.form.sizes")}</legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const on = sizeIds.includes(s.id);
            return (
              <Chip
                key={s.id}
                label={name(s)}
                onClick={() => {
                  const next = toggle(sizeIds, s.id);
                  setSizeIds(next);
                  rebuild(colorIds, next);
                }}
                color={on ? "primary" : "default"}
                variant={on ? "filled" : "outlined"}
                aria-pressed={on}
                sx={{ minHeight: 44, minWidth: 56, borderRadius: 22 }}
              />
            );
          })}
        </div>
      </fieldset>

      {variants.length === 0 ? (
        <p className="text-ink-muted">{t("admin.form.noVariants")}</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-brand bg-leather/50 p-3 md:flex-row md:items-end">
            <span className="text-sm font-medium md:mb-3">{t("admin.form.fillAll")}</span>
            <div className="grid grid-cols-2 gap-3 md:flex-1">
              <NumberField label={t("admin.form.fillPrice")} value={fillPrice} onChange={setFillPrice} decimal />
              <NumberField label={t("admin.form.fillStock")} value={fillStock} onChange={setFillStock} />
            </div>
            <Button variant="outlined" onClick={applyToAll} disabled={fillPrice === "" && fillStock === ""}>
              {t("admin.form.apply")}
            </Button>
          </div>

          {colors
            .filter((c) => colorIds.includes(c.id))
            .map((color) => (
              <section key={color.id} className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 font-medium">
                  <Swatch hex={color.hex} /> {name(color)}
                </h3>
                {variants
                  .filter((v) => v.color_id === color.id)
                  .map((v) => {
                    const key = variantKey(v);
                    const size = sizes.find((s) => s.id === v.size_id);
                    const err = errors[key] ?? {};
                    return (
                      <div
                        key={key}
                        className={`grid grid-cols-2 gap-3 rounded-brand bg-white p-3 shadow-sm md:grid-cols-[4rem_1fr_1fr_1fr_1.4fr_auto] md:items-start ${
                          v.is_active ? "" : "opacity-60"
                        }`}
                      >
                        <span className="col-span-2 flex min-h-11 items-center font-medium md:col-span-1">
                          {size ? name(size) : "?"}
                        </span>
                        <NumberField
                          label={t("admin.form.price")}
                          value={v.price}
                          onChange={(price) => update(key, { price })}
                          error={err.price}
                          decimal
                        />
                        <NumberField
                          label={t("admin.form.stock")}
                          value={v.stock}
                          onChange={(stock) => update(key, { stock })}
                        />
                        <NumberField
                          label={t("admin.form.compareAt")}
                          value={v.compare_at_price}
                          onChange={(compare_at_price) => update(key, { compare_at_price })}
                          error={err.compare}
                          decimal
                        />
                        <TextField
                          label={t("admin.form.sku")}
                          value={v.sku}
                          onChange={(e) => update(key, { sku: e.target.value })}
                          error={Boolean(err.sku)}
                          helperText={err.sku}
                          slotProps={{ htmlInput: { dir: "ltr" } }}
                        />
                        <FormControlLabel
                          className="col-span-2 md:col-span-1"
                          control={
                            <Switch
                              checked={v.is_active}
                              onChange={(e) => update(key, { is_active: e.target.checked })}
                            />
                          }
                          label={t("admin.form.variantActive")}
                          sx={{ minHeight: 44, m: 0 }}
                        />
                      </div>
                    );
                  })}
              </section>
            ))}
        </>
      )}
    </div>
  );
}

export function Swatch({ hex }: { hex: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-5 shrink-0 rounded-full border border-ink/20"
      // Colors come from the database (the product's own colors), not the brand palette.
      style={{ backgroundColor: hex }}
    />
  );
}

function NumberField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  decimal?: boolean;
}) {
  return (
    <TextField
      label={props.label}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value.replace(props.decimal ? /[^\d.]/g : /\D/g, ""))}
      error={Boolean(props.error)}
      helperText={props.error}
      slotProps={{ htmlInput: { inputMode: props.decimal ? "decimal" : "numeric", dir: "ltr" } }}
    />
  );
}

function unique(ids: number[]) {
  return [...new Set(ids)];
}
