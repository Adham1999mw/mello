import {
  deleteMyReview,
  getMyReview,
  getReviewStats,
  listReviews,
  submitReview,
  type ReviewInput,
} from "@/lib/catalog/reviews";
import type { MyReview, ReviewPage, ReviewQuery, ReviewStats } from "@/lib/catalog/types";
import { api } from "./api";
import { toError } from "./products";

/**
 * RTK Query hooks for product reviews (Supabase from the browser, so GitHub Pages works too).
 *
 *   const { data: stats } = useGetReviewStatsQuery(slug);
 *   const { data: page } = useListReviewsQuery({ slug, sort: "newest", page: 1 });
 *   const { data: mine } = useGetMyReviewQuery(slug);  // null when signed out / not written
 *   const [submit, { isLoading }] = useSubmitReviewMutation();
 *   await submit({ slug, productId, rating: 5, body }).unwrap();
 *
 * Writing, editing or deleting a review refetches her review and the public summary + list.
 */
const reviewTags = (slug: string) =>
  (["mine", "stats", "list"] as const).map((kind) => ({ type: "Review" as const, id: `${kind}-${slug}` }));

export const reviewsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReviewStats: build.query<ReviewStats, string>({
      async queryFn(slug) {
        try {
          return { data: await getReviewStats(slug) };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      providesTags: (_r, _e, slug) => [{ type: "Review", id: `stats-${slug}` }],
    }),
    listReviews: build.query<ReviewPage, ReviewQuery>({
      async queryFn(query) {
        try {
          return { data: await listReviews(query) };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      providesTags: (_r, _e, query) => [{ type: "Review", id: `list-${query.slug}` }],
    }),
    getMyReview: build.query<MyReview | null, string>({
      async queryFn(slug) {
        try {
          return { data: await getMyReview(slug) };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      providesTags: (_r, _e, slug) => [{ type: "Review", id: `mine-${slug}` }],
    }),
    submitReview: build.mutation<MyReview, ReviewInput & { slug: string }>({
      async queryFn({ productId, rating, body, reviewId }) {
        try {
          return { data: await submitReview({ productId, rating, body, reviewId }) };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      // Editing an approved review sends it back to "pending", so it leaves the public list.
      invalidatesTags: (_r, _e, { slug }) => reviewTags(slug),
    }),
    deleteMyReview: build.mutation<null, { slug: string; reviewId: number }>({
      async queryFn({ reviewId }) {
        try {
          await deleteMyReview(reviewId);
          return { data: null };
        } catch (error) {
          return { error: toError(error) };
        }
      },
      // Her review may have been approved, so the public summary and list change too.
      invalidatesTags: (_r, _e, { slug }) => reviewTags(slug),
    }),
  }),
});

export const {
  useGetReviewStatsQuery,
  useListReviewsQuery,
  useGetMyReviewQuery,
  useSubmitReviewMutation,
  useDeleteMyReviewMutation,
} = reviewsApi;
