import { useRef, useState } from "react";
import Image from "next/image";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Button, IconButton, Typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { productImageUrl } from "@/lib/catalog/products";
import { uploadProductImage, type AdminColor, type ImageForm } from "@/lib/admin/api";
import { useAdminError } from "./useAdminError";

type Props = {
  images: ImageForm[];
  colors: AdminColor[];
  onChange: (images: ImageForm[]) => void;
  /** Called with the Storage path of a photo that was removed from the list. */
  onRemove: (image: ImageForm) => void;
};

/** Upload, order, link to a color, and remove product photos. */
export default function ImagesEditor({ images, colors, onChange, onRemove }: Props) {
  const { t, locale } = useTranslation();
  const toMessage = useAdminError();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const added: ImageForm[] = [];
    try {
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file);
        added.push({ id: null, url, color_id: null, alt_ar: "", alt_en: "" });
      }
    } catch (e) {
      setError(toMessage(e));
    } finally {
      onChange([...images, ...added]);
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  function move(index: number, by: number) {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  }

  function update(index: number, patch: Partial<ImageForm>) {
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }

  return (
    <div className="flex flex-col gap-3">
      <Typography variant="bodySm" color="muted">
        {t("admin.form.imagesHelp")}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <ul className="flex flex-col gap-3 md:grid md:grid-cols-2">
        {images.map((img, index) => (
          <li key={`${img.id ?? "new"}-${img.url}`} className="flex gap-3 rounded-brand bg-white p-2 shadow-sm">
            <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-brand bg-leather">
              <Image src={productImageUrl(img.url)!} alt="" fill sizes="96px" className="object-cover" />
              {index === 0 && (
                <span className="absolute inset-x-0 bottom-0 bg-burgundy/80 py-0.5 text-center text-xs text-champagne">
                  ★
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <TextField
                select
                size="small"
                label={t("admin.form.imageColor")}
                value={img.color_id ?? ""}
                onChange={(e) => update(index, { color_id: e.target.value === "" ? null : Number(e.target.value) })}
              >
                <MenuItem value="">{t("admin.form.anyColor")}</MenuItem>
                {colors.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {locale === "en" ? c.name_en : c.name_ar}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label={locale === "en" ? t("admin.form.altEn") : t("admin.form.altAr")}
                value={locale === "en" ? img.alt_en : img.alt_ar}
                onChange={(e) => update(index, locale === "en" ? { alt_en: e.target.value } : { alt_ar: e.target.value })}
              />
              <div className="flex items-center gap-1">
                <IconButton label={t("admin.form.moveUp")} tone="ink" disabled={index === 0} onClick={() => move(index, -1)}>
                  <Arrow up />
                </IconButton>
                <IconButton
                  label={t("admin.form.moveDown")}
                  tone="ink"
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <Arrow />
                </IconButton>
                <Button
                  variant="text"
                  tone="danger"
                  size="sm"
                  className="ms-auto"
                  onClick={() => {
                    onRemove(img);
                    onChange(images.filter((_, i) => i !== index));
                  }}
                >
                  {t("admin.form.remove")}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button variant="outline" fullWidth disabled={uploading} onClick={() => input.current?.click()}>
        {uploading ? t("admin.form.uploading") : t("admin.form.upload")}
      </Button>
    </div>
  );
}

function Arrow({ up = false }: { up?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d={up ? "M6 14l6-6 6 6" : "M6 10l6 6 6-6"} />
    </svg>
  );
}
