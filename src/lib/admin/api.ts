import { createClient } from "@/lib/supabase/client";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { productImageUrl } from "@/lib/catalog/products";

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
  is_featured: boolean;
  variants: VariantForm[];
  images: ImageForm[];
};

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
  const { data: images } = await client.from("product_images").select("url").eq("product_id", id);
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) throw error;
  await deleteStorageFiles((images ?? []).map((i) => i.url));
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
