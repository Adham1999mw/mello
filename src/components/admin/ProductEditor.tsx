import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { Button, Typography, typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import {
  deleteProduct,
  deleteStorageFiles,
  emptyProduct,
  getAdminProduct,
  getCatalogOptions,
  saveProduct,
  slugify,
  type AdminCategory,
  type AdminColor,
  type AdminSize,
  type ImageForm,
  type ProductForm,
} from "@/lib/admin/api";
import FeatureImageEditor from "./FeatureImageEditor";
import ImagesEditor from "./ImagesEditor";
import VariantsEditor, { variantKey, type VariantErrors } from "./VariantsEditor";
import { useAdminError } from "./useAdminError";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type Options = { categories: AdminCategory[]; colors: AdminColor[]; sizes: AdminSize[] };
type FieldErrors = Partial<Record<"name_ar" | "name_en" | "slug", string>>;

/** Add or edit one product: basics, color × size variants, photos. `id` null = new. */
export default function ProductEditor({ id }: { id: number | null }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const toMessage = useAdminError();

  const [form, setForm] = useState<ProductForm | null>(id ? null : emptyProduct());
  const [options, setOptions] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [variantErrors, setVariantErrors] = useState<VariantErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Saved photos removed in this edit: their files are deleted after the next save.
  const removedFiles = useRef<string[]>([]);
  // The lookbook image as saved in the database (an upload that replaces it is not saved yet).
  const savedFeatureUrl = useRef<string | null>(null);
  // Slug follows the English name until you edit it yourself.
  const [slugTouched, setSlugTouched] = useState(Boolean(id));

  useEffect(() => {
    let active = true;
    Promise.all([getCatalogOptions(), id ? getAdminProduct(id) : Promise.resolve(emptyProduct())])
      .then(([opts, product]) => {
        if (!active) return;
        setOptions(opts);
        if (product) {
          setForm(product);
          savedFeatureUrl.current = product.feature_image_url;
        }
        else setNotFound(true);
      })
      .catch((e) => active && setLoadError(toMessage(e)));
    return () => {
      active = false;
    };
  }, [id, toMessage]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const message = t("admin.form.unsaved");
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onRouteChange = () => {
      if (!window.confirm(message)) {
        router.events.emit("routeChangeError");
        throw "Route change cancelled";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    router.events.on("routeChangeStart", onRouteChange);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      router.events.off("routeChangeStart", onRouteChange);
    };
  }, [dirty, router, t]);

  if (loadError) return <Alert severity="error">{loadError}</Alert>;
  if (notFound) return <Alert severity="warning">{t("admin.form.notFound")}</Alert>;
  if (!form || !options) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress />
      </div>
    );
  }

  const set = (patch: Partial<ProductForm>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
    setDirty(true);
  };

  function validate(f: ProductForm) {
    const fe: FieldErrors = {};
    if (!f.name_ar.trim()) fe.name_ar = t("admin.form.required");
    if (!f.name_en.trim()) fe.name_en = t("admin.form.required");
    if (!SLUG_RE.test(f.slug.trim())) fe.slug = f.slug.trim() ? t("admin.form.invalidSlug") : t("admin.form.required");
    const ve: VariantErrors = {};
    for (const v of f.variants) {
      const e: VariantErrors[string] = {};
      const price = Number(v.price);
      if (v.price.trim() === "" || !Number.isFinite(price)) e.price = t("admin.form.invalidPrice");
      if (v.compare_at_price.trim() !== "" && !(Number(v.compare_at_price) > price)) e.compare = t("admin.form.compareHigher");
      if (!v.sku.trim()) e.sku = t("admin.form.required");
      if (Object.keys(e).length) ve[variantKey(v)] = e;
    }
    setFieldErrors(fe);
    setVariantErrors(ve);
    return Object.keys(fe).length === 0 && Object.keys(ve).length === 0;
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaveError(null);
    if (!validate(form)) {
      setSaveError(t("admin.errors.invalid"));
      return;
    }
    setSaving(true);
    try {
      const newId = await saveProduct(form, removedFiles.current);
      removedFiles.current = [];
      setDirty(false);
      setSaved(true);
      // Reload, so new variants and photos get their ids.
      const fresh = await getAdminProduct(newId);
      if (fresh) {
        setForm(fresh);
        savedFeatureUrl.current = fresh.feature_image_url;
      }
      if (!form.id) {
        setSlugTouched(true);
        await router.replace(localePath(locale, `/admin/product?id=${newId}`), undefined, { shallow: true });
      }
    } catch (e) {
      setSaveError(toMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form?.id) return;
    setConfirmDelete(false);
    setSaving(true);
    try {
      await deleteProduct(form.id);
      setDirty(false);
      await router.push(localePath(locale, "/admin"));
    } catch (e) {
      setSaveError(toMessage(e));
      setSaving(false);
    }
  }

  function handleRemoveImage(img: ImageForm) {
    if (img.id === null) deleteStorageFiles([img.url]); // never saved: delete the upload now
    else removedFiles.current.push(img.url);
  }

  function handleRemoveFeatureImage(url: string) {
    if (url === savedFeatureUrl.current) removedFiles.current.push(url); // delete after the save
    else deleteStorageFiles([url]); // never saved: delete the upload now
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href={localePath(locale, "/admin")} className={`flex min-h-11 items-center text-ink-muted ${typography("bodySm")}`}>
          {locale === "ar" ? "→" : "←"} {t("admin.form.back")}
        </Link>
        <Typography variant="h1" color="burgundy">
          {form.id ? t("admin.form.editTitle") : t("admin.form.newTitle")}
        </Typography>
      </div>

      <Section title={t("admin.form.basics")}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label={t("admin.form.nameAr")}
            value={form.name_ar}
            onChange={(e) => set({ name_ar: e.target.value })}
            error={Boolean(fieldErrors.name_ar)}
            helperText={fieldErrors.name_ar}
            required
            slotProps={{ htmlInput: { dir: "rtl" } }}
          />
          <TextField
            label={t("admin.form.nameEn")}
            value={form.name_en}
            onChange={(e) =>
              set({ name_en: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })
            }
            error={Boolean(fieldErrors.name_en)}
            helperText={fieldErrors.name_en}
            required
            slotProps={{ htmlInput: { dir: "ltr" } }}
          />
          <TextField
            label={t("admin.form.slug")}
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") });
            }}
            error={Boolean(fieldErrors.slug)}
            helperText={fieldErrors.slug ?? t("admin.form.slugHelp")}
            required
            slotProps={{ htmlInput: { dir: "ltr", autoCapitalize: "none" } }}
          />
          <TextField
            select
            label={t("admin.form.category")}
            value={form.category_id ?? ""}
            onChange={(e) => set({ category_id: e.target.value === "" ? null : Number(e.target.value) })}
          >
            <MenuItem value="">{t("admin.form.noCategory")}</MenuItem>
            {options.categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {locale === "en" ? c.name_en : c.name_ar}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t("admin.form.descriptionAr")}
            value={form.description_ar}
            onChange={(e) => set({ description_ar: e.target.value })}
            multiline
            minRows={3}
            slotProps={{ htmlInput: { dir: "rtl" } }}
          />
          <TextField
            label={t("admin.form.descriptionEn")}
            value={form.description_en}
            onChange={(e) => set({ description_en: e.target.value })}
            multiline
            minRows={3}
            slotProps={{ htmlInput: { dir: "ltr" } }}
          />
        </div>
        <div className="flex flex-col md:flex-row md:gap-6">
          <FormControlLabel
            control={<Switch checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />}
            label={t("admin.form.active")}
            sx={{ minHeight: 44, m: 0 }}
          />
        </div>
      </Section>

      <Section title={t("admin.form.variantsTitle")}>
        <VariantsEditor
          // Remount after loading a product, so the picked colors/sizes match it.
          key={form.id ?? "new"}
          slug={form.slug}
          colors={options.colors}
          sizes={options.sizes}
          variants={form.variants}
          onChange={(variants) => set({ variants })}
          errors={variantErrors}
        />
      </Section>

      <Section title={t("admin.form.images")}>
        <ImagesEditor
          images={form.images}
          colors={options.colors.filter((c) => form.variants.some((v) => v.color_id === c.id))}
          onChange={(images) => set({ images })}
          onRemove={handleRemoveImage}
        />
      </Section>

      <Section title={t("admin.form.lookbookTitle")}>
        <FeatureImageEditor
          value={form}
          onChange={set}
          onRemove={handleRemoveFeatureImage}
          coverUrl={form.images[0]?.url ?? null}
        />
      </Section>

      {/* Save bar: stays at the bottom of the screen on phones, easy to reach with a thumb. */}
      <div className="sticky bottom-0 z-30 -mx-4 flex flex-col gap-2 border-t border-ink/10 bg-ivory/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:flex-row-reverse md:border-0 md:bg-transparent md:px-0">
        {saveError && <Alert severity="error" className="md:flex-1">{saveError}</Alert>}
        <Button type="submit" fullWidth="mobile" disabled={saving}>
          {saving ? t("admin.form.saving") : t("admin.form.save")}
        </Button>
        {form.id && (
          <Button variant="text" tone="danger" fullWidth="mobile" disabled={saving} onClick={() => setConfirmDelete(true)}>
            {t("admin.form.delete")}
          </Button>
        )}
      </div>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>{t("admin.form.deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <p>{t("admin.form.deleteConfirm")}</p>
        </DialogContent>
        <DialogActions>
          <Button variant="text" tone="ink" size="sm" onClick={() => setConfirmDelete(false)}>
            {t("admin.form.cancel")}
          </Button>
          <Button tone="danger" size="sm" onClick={handleDelete}>
            {t("admin.form.confirmDelete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={saved} autoHideDuration={2500} onClose={() => setSaved(false)} message={t("admin.form.saved")} />
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-brand bg-white/60 p-4 shadow-sm md:p-6">
      <Typography variant="h2" color="burgundy">
        {title}
      </Typography>
      {children}
    </section>
  );
}
