import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Rating from "@mui/material/Rating";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Button, Typography } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import {
  deleteAdminReview,
  listAdminReviews,
  updateAdminReview,
  type AdminReview,
} from "@/lib/admin/api";
import type { ReviewStatus } from "@/lib/supabase/database.types";
import { useAdminError } from "./useAdminError";

const PAGE_SIZE = 20;
const STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"];

/** Approve, reject, mark "Verified buyer" or delete customer reviews. Waiting ones first. */
export default function ReviewsModeration() {
  const { t } = useTranslation();
  const toMessage = useAdminError();
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminReview[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await listAdminReviews({ status, page, pageSize: PAGE_SIZE });
      setData(result);
      setError(null);
    } catch (e) {
      setError(toMessage(e));
    }
  }, [status, page, toMessage]);

  useEffect(() => {
    // Loads when the tab or page changes; `load` also runs after every action.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Typography variant="h1" color="burgundy">
          {t("admin.reviews.title")}
        </Typography>
        <Typography variant="bodySm" color="muted">
          {t("admin.reviews.help")}
        </Typography>
      </div>

      <Tabs
        value={status}
        onChange={(_, value: ReviewStatus) => {
          setStatus(value);
          setPage(1);
          setData(null);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        {STATUSES.map((s) => (
          <Tab key={s} value={s} label={t(`admin.reviews.${s}`)} sx={{ minHeight: 48 }} />
        ))}
      </Tabs>

      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      )}
      {data && data.items.length === 0 && (
        <Typography color="muted" className="py-10 text-center">
          {t("admin.reviews.empty")}
        </Typography>
      )}

      {data && data.items.length > 0 && (
        <>
          <Typography variant="bodySm" color="muted">
            {t("admin.reviews.total", { count: data.total })}
          </Typography>
          <ul className="flex flex-col gap-3">
            {data.items.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} onChanged={load} />
              </li>
            ))}
          </ul>
        </>
      )}

      {data && pages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t("admin.list.prev")}
          </Button>
          <Typography variant="bodySm" color="muted" as="span">
            {t("admin.list.pageOf", { page, pages })}
          </Typography>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            {t("admin.list.next")}
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, onChanged }: { review: AdminReview; onChanged: () => Promise<void> }) {
  const { t, locale } = useTranslation();
  const toMessage = useAdminError();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(review.is_verified);

  /** Runs an action, shows its error, and reloads the list. Returns false if it failed. */
  async function run(action: () => Promise<void>, reload = true) {
    setBusy(true);
    setError(null);
    try {
      await action();
      if (reload) await onChanged();
      return true;
    } catch (e) {
      setError(toMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const product = review.product
    ? locale === "en"
      ? review.product.name_en
      : review.product.name_ar
    : t("admin.reviews.deletedProduct");
  const date = new Date(review.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="flex flex-col gap-3 rounded-brand bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <Typography variant="subtitle" as="h2">
          {product}
        </Typography>
        <Typography variant="caption" color="muted">
          {review.display_name || t("admin.reviews.noName")} · {date}
        </Typography>
      </div>
      <Rating value={review.rating} readOnly size="small" aria-label={t("admin.reviews.stars", { count: review.rating })} />
      <Typography variant="body" className="whitespace-pre-line break-words">
        {review.body}
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={verified}
            disabled={busy}
            onChange={(e) => {
              const next = e.target.checked;
              setVerified(next);
              run(() => updateAdminReview(review.id, { is_verified: next }), false).then((ok) => {
                if (!ok) setVerified(!next);
              });
            }}
          />
        }
        label={t("admin.reviews.verified")}
        sx={{ minHeight: 44, m: 0 }}
      />

      {error && <Alert severity="error">{error}</Alert>}

      <div className="flex flex-col gap-2 md:flex-row">
        {review.status !== "approved" && (
          <Button fullWidth="mobile" disabled={busy} onClick={() => run(() => updateAdminReview(review.id, { status: "approved" }))}>
            {t("admin.reviews.approve")}
          </Button>
        )}
        {review.status !== "rejected" && (
          <Button
            variant="outline"
            fullWidth="mobile"
            disabled={busy}
            onClick={() => run(() => updateAdminReview(review.id, { status: "rejected" }))}
          >
            {t("admin.reviews.reject")}
          </Button>
        )}
        {review.status !== "pending" && (
          <Button
            variant="text"
            tone="ink"
            fullWidth="mobile"
            disabled={busy}
            onClick={() => run(() => updateAdminReview(review.id, { status: "pending" }))}
          >
            {t("admin.reviews.backToPending")}
          </Button>
        )}
        <Button
          variant="text"
          tone="danger"
          fullWidth="mobile"
          disabled={busy}
          className="md:ms-auto"
          onClick={() => {
            if (window.confirm(t("admin.reviews.deleteConfirm"))) run(() => deleteAdminReview(review.id));
          }}
        >
          {t("admin.reviews.delete")}
        </Button>
      </div>
    </article>
  );
}
