import { createClient } from "@/lib/supabase/client";
import type { CareIcon, Json, ReviewStatus, Tables } from "@/lib/supabase/database.types";
import { productImageUrl } from "@/lib/catalog/products";
import type { ImageFit } from "@/lib/catalog/types";

/**
 * Admin reads and writes. They use the logged-in user's session (anon key + login),
 * never the service_role key. The database only allows writes for users in public.admins.
 */
const supabase = () => createClient();
const BUCKET = "product-images";

export type AdminCategory = Tables<"categories">;
export type AdminColor = Tables<"colors">;
export type AdminSize = Tables<"sizes">;

export type AdminProductRow = Pick<
  Tables<"products">,
  "id" | "slug" | "name_ar" | "name_en" | "is_active" | "is_featured" | "updated_at"
> & {
  category: { name_ar: string; name_en: string } | null;
  cover: string | null;
  variantCount: number;
  totalStock: number;
  minPrice: number | null;
};

/** The product form: everything about one product. */
export type ProductForm = {
  id: number | null;
  slug: string;
  category_id: number | null;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  is_active: boolean;
  /** Shown in the homepage lookbook. */
  is_featured: boolean;
  /** The special lookbook image: Storage path or full URL, or null to use the cover photo. */
  feature_image_url: string | null;
  feature_image_alt_ar: string;
  feature_image_alt_en: string;
  feature_image_fit: ImageFit;
  /** "Fabric & care" + fit details (text fields; "" = not set). */
  specs: SpecsForm;
  variants: VariantForm[];
  images: ImageForm[];
};

export type SpecsForm = {
  fabric_ar: string;
  fabric_en: string;
  /** g/m², digits only */
  fabric_weight_gsm: string;
  origin_ar: string;
  origin_en: string;
  care_ar: string;
  care_en: string;
  care_icons: CareIcon[];
  /** cm, digits only */
  model_height_cm: string;
  /** a size code, "" = not set */
  model_size_code: string;
  delivery_note_ar: string;
  delivery_note_en: string;
};

/** Care symbols the admin can pick, in this order (allowed by the database check). */
export const CARE_ICONS: CareIcon[] = [
  "wash_30",
  "wash_40",
  "hand_wash",
  "no_wash",
  "no_bleach",
  "no_tumble_dry",
  "tumble_dry_low",
  "dry_flat",
  "line_dry",
  "iron_low",
  "iron_medium",
  "no_iron",
  "dry_clean",
  "no_dry_clean",
];

const emptySpecs = (): SpecsForm => ({
  fabric_ar: "",
  fabric_en: "",
  fabric_weight_gsm: "",
  origin_ar: "",
  origin_en: "",
  care_ar: "",
  care_en: "",
  care_icons: [],
  model_height_cm: "",
  model_size_code: "",
  delivery_note_ar: "",
  delivery_note_en: "",
});

export type VariantForm = {
  color_id: number;
  size_id: number;
  sku: string;
  price: string;
  compare_at_price: string;
  stock: string;
  is_active: boolean;
};

export type ImageForm = {
  /** null = new (uploaded, not saved yet) */
  id: number | null;
  /** Storage path or full URL, as saved in product_images.url */
  url: string;
  color_id: number | null;
  alt_ar: string;
  alt_en: string;
};

export const emptyProduct = (): ProductForm => ({
  id: null,
  slug: "",
  category_id: null,
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  is_active: true,
  is_featured: false,
  feature_image_url: null,
  feature_image_alt_ar: "",
  feature_image_alt_en: "",
  feature_image_fit: "contain",
  specs: emptySpecs(),
  variants: [],
  images: [],
});

/** "Layla Maxi Dress!" -> "layla-maxi-dress" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------- products ----------

export async function listAdminProducts(opts: { search?: string; page: number; pageSize: number }) {
  const from = (opts.page - 1) * opts.pageSize;
  let query = supabase()
    .from("products")
    .select(
      `id, slug, name_ar, name_en, is_active, is_featured, updated_at,
       category:categories ( name_ar, name_en ),
       images:product_images ( url, sort_order ),
       variants:product_variants ( price, stock )`,
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + opts.pageSize - 1);

  const search = opts.search?.trim().replace(/[%,()]/g, " ");
  if (search) query = query.or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%,slug.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error?.code === "PGRST103") return { items: [] as AdminProductRow[], total: 0 };
  if (error) throw error;

  const items: AdminProductRow[] = (data ?? []).map((p) => {
    const cover = [...p.images].sort((a, b) => a.sort_order - b.sort_order)[0];
    const prices = p.variants.map((v) => Number(v.price));
    return {
      id: p.id,
      slug: p.slug,
      name_ar: p.name_ar,
      name_en: p.name_en,
      is_active: p.is_active,
      is_featured: p.is_featured,
      updated_at: p.updated_at,
      category: p.category,
      cover: productImageUrl(cover?.url ?? null),
      variantCount: p.variants.length,
      totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
      minPrice: prices.length ? Math.min(...prices) : null,
    };
  });
  return { items, total: count ?? 0 };
}

export async function getAdminProduct(id: number): Promise<ProductForm | null> {
  const { data, error } = await supabase()
    .from("products")
    .select(
      `*, images:product_images ( id, url, color_id, alt_ar, alt_en, sort_order ),
       variants:product_variants ( color_id, size_id, sku, price, compare_at_price, stock, is_active )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    category_id: data.category_id,
    name_ar: data.name_ar,
    name_en: data.name_en,
    description_ar: data.description_ar ?? "",
    description_en: data.description_en ?? "",
    is_active: data.is_active,
    is_featured: data.is_featured,
    feature_image_url: data.feature_image_url,
    feature_image_alt_ar: data.feature_image_alt_ar ?? "",
    feature_image_alt_en: data.feature_image_alt_en ?? "",
    feature_image_fit: data.feature_image_fit === "cover" ? "cover" : "contain",
    specs: {
      fabric_ar: data.fabric_ar ?? "",
      fabric_en: data.fabric_en ?? "",
      fabric_weight_gsm: data.fabric_weight_gsm == null ? "" : String(data.fabric_weight_gsm),
      origin_ar: data.origin_ar ?? "",
      origin_en: data.origin_en ?? "",
      care_ar: data.care_ar ?? "",
      care_en: data.care_en ?? "",
      care_icons: data.care_icons ?? [],
      model_height_cm: data.model_height_cm == null ? "" : String(data.model_height_cm),
      model_size_code: data.model_size_code ?? "",
      delivery_note_ar: data.delivery_note_ar ?? "",
      delivery_note_en: data.delivery_note_en ?? "",
    },
    variants: data.variants.map((v) => ({
      color_id: v.color_id,
      size_id: v.size_id,
      sku: v.sku,
      price: String(v.price),
      compare_at_price: v.compare_at_price == null ? "" : String(v.compare_at_price),
      stock: String(v.stock),
      is_active: v.is_active,
    })),
    images: [...data.images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({
        id: img.id,
        url: img.url,
        color_id: img.color_id,
        alt_ar: img.alt_ar ?? "",
        alt_en: img.alt_en ?? "",
      })),
  };
}

/**
 * Saves the product, its variants and its images in one transaction
 * (see admin_save_product in supabase/migrations). Returns the product id.
 * `removedImages` are Storage files to delete after a successful save.
 */
export async function saveProduct(form: ProductForm, removedImages: string[] = []): Promise<number> {
  const product = {
    id: form.id,
    slug: form.slug.trim(),
    category_id: form.category_id,
    name_ar: form.name_ar.trim(),
    name_en: form.name_en.trim(),
    description_ar: form.description_ar.trim(),
    description_en: form.description_en.trim(),
    is_active: form.is_active,
    is_featured: form.is_featured,
    feature_image_url: form.feature_image_url,
    feature_image_alt_ar: form.feature_image_alt_ar.trim(),
    feature_image_alt_en: form.feature_image_alt_en.trim(),
    feature_image_fit: form.feature_image_fit,
    // Specs: "" clears a field (see admin_save_product in 20261128000000_product_specs.sql).
    fabric_ar: form.specs.fabric_ar.trim(),
    fabric_en: form.specs.fabric_en.trim(),
    fabric_weight_gsm: form.specs.fabric_weight_gsm.trim(),
    origin_ar: form.specs.origin_ar.trim(),
    origin_en: form.specs.origin_en.trim(),
    care_ar: form.specs.care_ar.trim(),
    care_en: form.specs.care_en.trim(),
    care_icons: form.specs.care_icons,
    model_height_cm: form.specs.model_height_cm.trim(),
    model_size_code: form.specs.model_size_code,
    delivery_note_ar: form.specs.delivery_note_ar.trim(),
    delivery_note_en: form.specs.delivery_note_en.trim(),
  };
  const variants = form.variants.map((v) => ({
    color_id: v.color_id,
    size_id: v.size_id,
    sku: v.sku.trim(),
    price: Number(v.price),
    compare_at_price: v.compare_at_price.trim() === "" ? null : Number(v.compare_at_price),
    stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
    is_active: v.is_active,
  }));
  const images = form.images.map((img) => ({
    id: img.id,
    url: img.url,
    color_id: img.color_id,
    alt_ar: img.alt_ar.trim(),
    alt_en: img.alt_en.trim(),
  }));

  const { data, error } = await supabase().rpc("admin_save_product", {
    product: product as Json,
    variants: variants as Json,
    images: images as Json,
  });
  if (error) throw error;
  await deleteStorageFiles(removedImages);
  return data;
}

/** Deletes a product (its variants and image rows go with it) and its photos in Storage. */
export async function deleteProduct(id: number) {
  const client = supabase();
  const [{ data: images }, { data: product }] = await Promise.all([
    client.from("product_images").select("url").eq("product_id", id),
    client.from("products").select("feature_image_url").eq("id", id).maybeSingle(),
  ]);
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) throw error;
  const files = (images ?? []).map((i) => i.url);
  if (product?.feature_image_url) files.push(product.feature_image_url);
  await deleteStorageFiles(files);
}

// ---------- photos ----------

/** Uploads a photo to Storage and returns its path (saved in product_images.url). */
export async function uploadProductImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `products/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase().storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

/** Only files in our bucket are deleted; full URLs (e.g. placeholders) are skipped. */
export async function deleteStorageFiles(urls: string[]) {
  const paths = urls.filter((u) => u && !/^https?:\/\//.test(u));
  if (paths.length === 0) return;
  // A leftover file is harmless, so a failure here doesn't fail the save.
  await supabase().storage.from(BUCKET).remove(paths);
}

// ---------- categories, colors, sizes ----------

export async function getCatalogOptions() {
  const client = supabase();
  const [categories, colors, sizes] = await Promise.all([
    client.from("categories").select("*").order("sort_order").order("id"),
    client.from("colors").select("*").order("sort_order").order("id"),
    client.from("sizes").select("*").order("sort_order").order("id"),
  ]);
  for (const r of [categories, colors, sizes]) if (r.error) throw r.error;
  return { categories: categories.data ?? [], colors: colors.data ?? [], sizes: sizes.data ?? [] };
}

export type OptionTable = "categories" | "colors" | "sizes";
type OptionRow<T extends OptionTable> = Tables<T>;
type OptionInput<T extends OptionTable> = Omit<OptionRow<T>, "id" | "created_at"> & { id?: number };

export async function saveOption<T extends OptionTable>(table: T, row: OptionInput<T>) {
  const { id, ...values } = row as OptionInput<OptionTable> & { id?: number };
  const client = supabase();
  // The table name is a generic here, so the row type is checked by OptionInput instead.
  const query = id
    ? client.from(table as "colors").update(values as never).eq("id", id)
    : client.from(table as "colors").insert(values as never);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteOption(table: OptionTable, id: number) {
  const { error } = await supabase().from(table).delete().eq("id", id);
  if (error) throw error;
}

// ---------- delivery settings (store_settings, one row) ----------

export type DeliverySettingsForm = {
  delivery_ar: string;
  delivery_en: string;
  /** EGP, "" = no free delivery */
  free_shipping_threshold: string;
  cairo_days_min: string;
  cairo_days_max: string;
  other_days_min: string;
  other_days_max: string;
  exchange_days: string;
  cod_enabled: boolean;
};

export async function getDeliverySettings(): Promise<DeliverySettingsForm> {
  const { data, error } = await supabase().from("store_settings").select("*").single();
  if (error) throw error;
  return {
    delivery_ar: data.delivery_ar,
    delivery_en: data.delivery_en,
    free_shipping_threshold: data.free_shipping_threshold == null ? "" : String(Number(data.free_shipping_threshold)),
    cairo_days_min: String(data.cairo_days_min),
    cairo_days_max: String(data.cairo_days_max),
    other_days_min: String(data.other_days_min),
    other_days_max: String(data.other_days_max),
    exchange_days: String(data.exchange_days),
    cod_enabled: data.cod_enabled,
  };
}

export async function saveDeliverySettings(form: DeliverySettingsForm) {
  const int = (v: string) => Math.max(0, Math.floor(Number(v) || 0));
  const { error } = await supabase()
    .from("store_settings")
    .update({
      delivery_ar: form.delivery_ar.trim(),
      delivery_en: form.delivery_en.trim(),
      free_shipping_threshold: form.free_shipping_threshold.trim() === "" ? null : Number(form.free_shipping_threshold),
      cairo_days_min: int(form.cairo_days_min),
      cairo_days_max: int(form.cairo_days_max),
      other_days_min: int(form.other_days_min),
      other_days_max: int(form.other_days_max),
      exchange_days: int(form.exchange_days),
      cod_enabled: form.cod_enabled,
    })
    .eq("id", true);
  if (error) throw error;
}

// ---------- reviews ----------

export type AdminReview = {
  id: number;
  display_name: string | null;
  rating: number;
  body: string;
  is_verified: boolean;
  status: ReviewStatus;
  created_at: string;
  product: { id: number; slug: string; name_ar: string; name_en: string } | null;
};

/** Reviews in one status, newest first (admins see every status). */
export async function listAdminReviews(opts: { status: ReviewStatus; page: number; pageSize: number }) {
  const from = (opts.page - 1) * opts.pageSize;
  const { data, count, error } = await supabase()
    .from("reviews")
    .select(
      `id, display_name, rating, body, is_verified, status, created_at,
       product:products ( id, slug, name_ar, name_en )`,
      { count: "exact" },
    )
    .eq("status", opts.status)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + opts.pageSize - 1);
  if (error?.code === "PGRST103") return { items: [] as AdminReview[], total: 0 };
  if (error) throw error;
  return { items: (data ?? []) as AdminReview[], total: count ?? 0 };
}

/** Approve / reject a review, or mark it "Verified buyer". */
export async function updateAdminReview(id: number, patch: { status?: ReviewStatus; is_verified?: boolean }) {
  const { error } = await supabase().from("reviews").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteAdminReview(id: number) {
  const { error } = await supabase().from("reviews").delete().eq("id", id);
  if (error) throw error;
}

/** Turns a Supabase / Postgres error into a message key the UI can translate. */
export function errorKey(error: unknown):
  | "duplicate"
  | "inUse"
  | "forbidden"
  | "invalid"
  | "network"
  | "unknown" {
  const e = (error ?? {}) as { code?: string; message?: string; statusCode?: string };
  if (e.code === "23505") return "duplicate";
  if (e.code === "23503") return "inUse";
  if (e.code === "42501" || e.statusCode === "403" || /row-level security/i.test(e.message ?? "")) return "forbidden";
  if (e.code === "23514" || e.code === "22P02" || e.code === "23502") return "invalid";
  if (/fetch|network/i.test(e.message ?? "")) return "network";
  return "unknown";
}
