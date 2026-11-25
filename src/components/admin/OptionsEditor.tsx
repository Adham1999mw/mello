import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { useTranslation, type MessageKey } from "@/i18n/useTranslation";
import {
  deleteOption,
  getCatalogOptions,
  saveOption,
  slugify,
  type AdminCategory,
  type OptionTable,
} from "@/lib/admin/api";
import { Swatch } from "./VariantsEditor";
import { useAdminError } from "./useAdminError";

type Field = {
  key: string;
  label: MessageKey;
  kind: "text" | "ltr" | "number" | "color" | "switch" | "parent";
};

const FIELDS: Record<OptionTable, Field[]> = {
  categories: [
    { key: "name_ar", label: "admin.options.nameAr", kind: "text" },
    { key: "name_en", label: "admin.options.nameEn", kind: "ltr" },
    { key: "slug", label: "admin.options.slug", kind: "ltr" },
    { key: "parent_id", label: "admin.options.parent", kind: "parent" },
    { key: "sort_order", label: "admin.options.order", kind: "number" },
    { key: "is_active", label: "admin.options.active", kind: "switch" },
  ],
  colors: [
    { key: "name_ar", label: "admin.options.nameAr", kind: "text" },
    { key: "name_en", label: "admin.options.nameEn", kind: "ltr" },
    { key: "slug", label: "admin.options.slug", kind: "ltr" },
    { key: "hex", label: "admin.options.hex", kind: "color" },
    { key: "sort_order", label: "admin.options.order", kind: "number" },
  ],
  sizes: [
    { key: "code", label: "admin.options.code", kind: "ltr" },
    { key: "name_ar", label: "admin.options.nameAr", kind: "text" },
    { key: "name_en", label: "admin.options.nameEn", kind: "ltr" },
    { key: "sort_order", label: "admin.options.order", kind: "number" },
  ],
};

const EMPTY: Record<OptionTable, Row> = {
  categories: { name_ar: "", name_en: "", slug: "", parent_id: null, sort_order: 0, is_active: true },
  colors: { name_ar: "", name_en: "", slug: "", hex: "#000000", sort_order: 0 },
  sizes: { code: "", name_ar: "", name_en: "", sort_order: 0 },
};

type Row = { id?: number } & Record<string, string | number | boolean | null>;
const TABLES: OptionTable[] = ["categories", "colors", "sizes"];

/** Add, edit and delete categories, colors and sizes. */
export default function OptionsEditor() {
  const { t } = useTranslation();
  const toMessage = useAdminError();
  const [tab, setTab] = useState<OptionTable>("categories");
  const [data, setData] = useState<Record<OptionTable, Row[]> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const opts = await getCatalogOptions();
      setData(opts as unknown as Record<OptionTable, Row[]>);
      setError(null);
    } catch (e) {
      setError(toMessage(e));
    }
  }, [toMessage]);

  useEffect(() => {
    // Loads once when the page opens; `load` also runs after every save.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl text-burgundy">{t("admin.settings")}</h1>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile>
        {TABLES.map((table) => (
          <Tab key={table} value={table} label={t(`admin.options.${table}`)} sx={{ minHeight: 48 }} />
        ))}
      </Tabs>
      {error && <Alert severity="error">{error}</Alert>}
      {!data ? (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <OptionCard
            key={`new-${tab}`}
            table={tab}
            initial={EMPTY[tab]}
            categories={data.categories as unknown as AdminCategory[]}
            onSaved={load}
          />
          {data[tab].map((row) => (
            <OptionCard
              key={`${tab}-${row.id}`}
              table={tab}
              initial={row}
              categories={data.categories as unknown as AdminCategory[]}
              onSaved={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionCard(props: {
  table: OptionTable;
  initial: Row;
  categories: AdminCategory[];
  onSaved: () => Promise<void>;
}) {
  const { t, locale } = useTranslation();
  const toMessage = useAdminError();
  const [row, setRow] = useState<Row>(props.initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = row.id === undefined;
  const dirty = JSON.stringify(row) !== JSON.stringify(props.initial);

  function set(key: string, value: Row[string]) {
    setRow((r) => {
      const next = { ...r, [key]: value };
      // Fill the slug from the English name while adding.
      if (isNew && key === "name_en" && "slug" in r && (!r.slug || r.slug === slugify(String(r.name_en)))) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      if (isNew) setRow(props.initial);
      await props.onSaved();
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const title = String(locale === "en" ? row.name_en : row.name_ar) || t("admin.options.add");
  const parents = props.categories.filter((c) => c.id !== row.id);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveOption(props.table, row as never));
      }}
      className={`flex flex-col gap-3 rounded-brand p-3 shadow-sm ${isNew ? "border border-dashed border-burgundy/40 bg-leather/40" : "bg-white"}`}
    >
      <h2 className="flex items-center gap-2 font-medium">
        {props.table === "colors" && typeof row.hex === "string" && <Swatch hex={row.hex} />}
        {isNew ? `+ ${t("admin.options.add")}` : title}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {FIELDS[props.table].map((field) => {
          const value = row[field.key];
          const label = t(field.label);
          switch (field.kind) {
            case "switch":
              return (
                <FormControlLabel
                  key={field.key}
                  control={<Switch checked={Boolean(value)} onChange={(e) => set(field.key, e.target.checked)} />}
                  label={label}
                  sx={{ minHeight: 44, m: 0 }}
                />
              );
            case "parent":
              return (
                <TextField
                  key={field.key}
                  select
                  label={label}
                  value={value ?? ""}
                  onChange={(e) => set(field.key, e.target.value === "" ? null : Number(e.target.value))}
                >
                  <MenuItem value="">{t("admin.options.noParent")}</MenuItem>
                  {parents.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {locale === "en" ? c.name_en : c.name_ar}
                    </MenuItem>
                  ))}
                </TextField>
              );
            case "color":
              return (
                <div key={field.key} className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={label}
                    value={String(value)}
                    onChange={(e) => set(field.key, e.target.value.toUpperCase())}
                    className="size-11 shrink-0 cursor-pointer rounded-brand border border-ink/20 bg-transparent"
                  />
                  <TextField
                    label={label}
                    value={String(value)}
                    onChange={(e) => set(field.key, e.target.value)}
                    slotProps={{ htmlInput: { dir: "ltr" } }}
                    fullWidth
                  />
                </div>
              );
            case "number":
              return (
                <TextField
                  key={field.key}
                  label={label}
                  value={String(value ?? 0)}
                  onChange={(e) => set(field.key, Number(e.target.value.replace(/\D/g, "")) || 0)}
                  slotProps={{ htmlInput: { inputMode: "numeric", dir: "ltr" } }}
                />
              );
            default:
              return (
                <TextField
                  key={field.key}
                  label={label}
                  value={String(value ?? "")}
                  onChange={(e) => set(field.key, e.target.value)}
                  required
                  className={field.key === "name_ar" || field.key === "name_en" ? "col-span-2 md:col-span-1" : ""}
                  slotProps={{ htmlInput: { dir: field.kind === "ltr" ? "ltr" : undefined } }}
                />
              );
          }
        })}
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" variant="contained" disabled={busy || !dirty} className="flex-1 md:flex-none">
          {isNew ? t("admin.options.add") : t("admin.options.save")}
        </Button>
        {!isNew && (
          <Button
            color="error"
            disabled={busy}
            onClick={() => {
              if (window.confirm(t("admin.options.deleteConfirm", { name: title }))) {
                run(() => deleteOption(props.table, row.id!));
              }
            }}
          >
            {t("admin.options.delete")}
          </Button>
        )}
      </div>
    </form>
  );
}
