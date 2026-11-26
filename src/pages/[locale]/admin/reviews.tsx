import AdminShell from "@/components/admin/AdminShell";
import ReviewsModeration from "@/components/admin/ReviewsModeration";

export { getStaticPaths, getStaticProps } from "@/i18n/static";

// /ar/admin/reviews/: Approve, reject and mark customer reviews.
export default function AdminReviewsModerationPage() {
  return (
    <AdminShell>
      <ReviewsModeration />
    </AdminShell>
  );
}
