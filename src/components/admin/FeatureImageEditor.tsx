import { useRef, useState } from "react";
import Image from "next/image";
import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { Button, Typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { productImageUrl } from "@/lib/catalog/products";
import type { ImageFit } from "@/lib/catalog/types";
import { uploadProductImage, type ProductForm } from "@/lib/admin/api";
import { useAdminError } from "./useAdminError";

type FeatureFields = Pick<
  ProductForm,
  "is_featured" | "feature_image_url" | "feature_image_alt_ar" | "feature_image_alt_en" | "feature_image_fit"
>;

type Props = {
  value: FeatureFields;
  onChange: (patch: Partial<FeatureFields>) => void;
  /** Called with the Storage path of an image that was replaced or removed. */
  onRemove: (url: string) => void;
  /** The product's first photo, shown as the fallback when there is no special image. */
  coverUrl: string | null;
};

const FITS: ImageFit[] = ["contain", "cover"];

/**
 * The homepage lookbook settings of a product: the "featured" switch that puts it in the
 * lookbook, and its special image there (e.g. a cutout of the outfit). Without a special
 * image, the lookbook uses the product's cover photo.
 * Phone first: one column; the preview sits beside the settings from `md` up.
 */
export default function FeatureImageEditor({ value, onChange, onRemove, coverUrl }: Props) {
  const { t, locale } = useTranslation();
  const toMessage = useAdminError();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const special = value.feature_image_url;
  const preview = productImageUrl(special ?? coverUrl);
  const fit: ImageFit = special ? value.feature_image_fit : "cover";

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductImage(file);
      if (special) onRemove(special);
      onChange({ feature_image_url: url });
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  function remove() {
    if (special) onRemove(special);
    onChange({ feature_image_url: null, feature_image_alt_ar: "", feature_image_alt_en: "" });
  }

  return (
    <div className="flex flex-col gap-4">
      <FormControlLabel
        control={<Switch checked={value.is_featured} onChange={(e) => onChange({ is_featured: e.target.checked })} />}
        label={t("admin.form.featured")}
        sx={{ minHeight: 44, m: 0 }}
      />
      <Typography variant="bodySm" color="muted">
        {t("admin.form.featureHelp")}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Preview in the lookbook's frame and background */}
        <div className="relative aspect-[3/4] w-full max-w-60 shrink-0 self-center overflow-hidden rounded-brand bg-leather/45 md:self-start">
          {preview ? (
            <Image
              src={preview}
              alt=""
              fill
              sizes="240px"
              className={fit === "contain" ? "object-contain" : "object-cover"}
            />
          ) : (
            <Typography variant="bodySm" color="muted" className="absolute inset-0 grid place-items-center p-4 text-center">
              {t("admin.form.featureNoImage")}
            </Typography>
          )}
          {!special && preview && (
            <Typography
              variant="caption"
              className="absolute inset-x-0 bottom-0 bg-burgundy/80 py-1 text-center text-champagne"
            >
              {t("admin.form.featureUsingCover")}
            </Typography>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {special && (
            <>
              <div role="group" aria-label={t("admin.form.featureFit")} className="flex flex-col gap-2">
                <Typography variant="subtitle" as="span">
                  {t("admin.form.featureFit")}
                </Typography>
                <div className="grid grid-cols-2 gap-2">
                  {FITS.map((option) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={value.feature_image_fit === option ? "solid" : "outline"}
                      aria-pressed={value.feature_image_fit === option}
                      onClick={() => onChange({ feature_image_fit: option })}
                    >
                      {t(option === "contain" ? "admin.form.featureFitContain" : "admin.form.featureFitCover")}
                    </Button>
                  ))}
                </div>
              </div>
              <TextField
                label={locale === "en" ? t("admin.form.altEn") : t("admin.form.altAr")}
                value={locale === "en" ? value.feature_image_alt_en : value.feature_image_alt_ar}
                onChange={(e) =>
                  onChange(
                    locale === "en" ? { feature_image_alt_en: e.target.value } : { feature_image_alt_ar: e.target.value },
                  )
                }
                slotProps={{ htmlInput: { dir: locale === "en" ? "ltr" : "rtl" } }}
              />
            </>
          )}

          <input
            ref={input}
            type="file"
            accept="image/png,image/webp,image/avif,image/jpeg"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button variant="outline" fullWidth disabled={uploading} onClick={() => input.current?.click()}>
            {uploading
              ? t("admin.form.uploading")
              : special
                ? t("admin.form.featureReplace")
                : t("admin.form.featureUpload")}
          </Button>
          {special && (
            <Button variant="text" tone="danger" fullWidth disabled={uploading} onClick={remove}>
              {t("admin.form.remove")}
            </Button>
          )}
          <Typography variant="caption" color="muted">
            {t("admin.form.featureTip")}
          </Typography>
        </div>
      </div>
    </div>
  );
}
