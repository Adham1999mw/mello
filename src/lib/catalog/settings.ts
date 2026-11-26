import { getClient, type Client } from "./products";
import type { StoreSettings } from "./types";

/**
 * Delivery & returns info shared by every product page (table store_settings,
 * supabase/migrations/20261128000000_product_specs.sql). There is always one row.
 */
export async function getStoreSettings(client?: Client): Promise<StoreSettings> {
  const { data, error } = await getClient(client)
    .from("store_settings")
    .select(
      `delivery_ar, delivery_en, free_shipping_threshold, cairo_days_min, cairo_days_max,
       other_days_min, other_days_max, exchange_days, cod_enabled`,
    )
    .single();
  if (error) throw error;
  return {
    ...data,
    free_shipping_threshold: data.free_shipping_threshold == null ? null : Number(data.free_shipping_threshold),
  };
}
