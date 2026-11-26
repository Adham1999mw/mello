import { getClient, type Client } from "./products";
import type { MyReview, Review, ReviewPage, ReviewQuery, ReviewStats } from "./types";

/**
 * Product reviews (supabase/migrations/20261129000000_reviews.sql).
 * Anyone signed in can review a product once: stars + a comment. A new or edited
 * review waits for an admin to approve it; only approved reviews are public.
 *
 *   const stats = await getReviewStats("mariam-knit-set");      // 4.7 from 48 reviews
 *   const page  = await listReviews({ slug: "mariam-knit-set" }); // first 3, newest first
 *   await submitReview({ productId: 12, rating: 5, body: "…" });  // signed in only
 */

export const REVIEW_PAGE_SIZE = 3;
export const REVIEW_MAX_PAGE_SIZE = 50;
export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_MAX = 2000;

const EMPTY_STATS: ReviewStats = { review_count: 0, avg_rating: 0, counts: [0, 0, 0, 0, 0], verified_count: 0 };

/** Count, average and stars breakdown. A product with no reviews gives zeros. */
export async function getReviewStats(slug: string, client?: Client): Promise<ReviewStats> {
  const { data, error } = await getClient(client)
    .from("product_review_stats")
    .select("review_count, avg_rating, count_5, count_4, count_3, count_2, count_1, verified_count")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY_STATS;
  return {
    review_count: data.review_count ?? 0,
    avg_rating: Number(data.avg_rating ?? 0),
    counts: [data.count_5 ?? 0, data.count_4 ?? 0, data.count_3 ?? 0, data.count_2 ?? 0, data.count_1 ?? 0],
    verified_count: data.verified_count ?? 0,
  };
}

/** Approved reviews of a product, sorted and paged. */
export async function listReviews(query: ReviewQuery, client?: Client): Promise<ReviewPage> {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.min(REVIEW_MAX_PAGE_SIZE, Math.max(1, Math.floor(query.pageSize ?? REVIEW_PAGE_SIZE)));
  const { data, error } = await getClient(client).rpc("list_reviews", {
    product_slug: query.slug,
    sort: query.sort ?? "newest",
    page,
    page_size: pageSize,
  });
  if (error) throw error;
  const rows = data ?? [];
  // total_count is on every row; a page past the end has no rows, so ask for the count.
  const total = rows[0]?.total_count ?? (page > 1 ? (await getReviewStats(query.slug, client)).review_count : 0);
  const items: Review[] = rows.map((r) => ({
    id: r.id,
    display_name: r.display_name,
    rating: r.rating,
    body: r.body,
    is_verified: r.is_verified,
    created_at: r.created_at,
  }));
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** The signed-in customer's review of this product (any status), or null. Null when signed out. */
export async function getMyReview(slug: string, client?: Client): Promise<MyReview | null> {
  const supabase = getClient(client);
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const { data, error } = await supabase.rpc("my_review", { product_slug: slug });
  if (error) throw error;
  return data?.[0] ?? null;
}

export type ReviewInput = {
  productId: number;
  /** 1 to 5 */
  rating: number;
  /** 10 to 2000 characters */
  body: string;
  /** Set to edit her existing review instead of writing a new one. */
  reviewId?: number | null;
};

/** Problems the form can show before sending. Empty = OK. */
export function validateReview(input: Pick<ReviewInput, "rating" | "body">) {
  const errors: { rating?: "required"; body?: "tooShort" | "tooLong" } = {};
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) errors.rating = "required";
  const length = input.body.trim().length;
  if (length < REVIEW_BODY_MIN) errors.body = "tooShort";
  else if (length > REVIEW_BODY_MAX) errors.body = "tooLong";
  return errors;
}

/**
 * Writes or edits the signed-in customer's review. It is saved as "pending" either way.
 * Errors: code 23505 = she already reviewed this product (edit it instead),
 * 42501 = not signed in.
 */
export async function submitReview(input: ReviewInput, client?: Client): Promise<MyReview> {
  const supabase = getClient(client);
  const values = { rating: input.rating, body: input.body.trim() };
  const columns = "id, rating, body, status, created_at, updated_at";
  const { data, error } = input.reviewId
    ? await supabase.from("reviews").update(values).eq("id", input.reviewId).select(columns).single()
    : await supabase.from("reviews").insert({ product_id: input.productId, ...values }).select(columns).single();
  if (error) throw error;
  return data;
}

/** Deletes the signed-in customer's own review. */
export async function deleteMyReview(reviewId: number, client?: Client) {
  const { error } = await getClient(client).from("reviews").delete().eq("id", reviewId);
  if (error) throw error;
}
