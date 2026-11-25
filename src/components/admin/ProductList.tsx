import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { Button, Typography } from "@/components/ui";
import { localePath } from "@/i18n/static";
import { useTranslation } from "@/i18n/useTranslation";
import { listAdminProducts, type AdminProductRow } from "@/lib/admin/api";
import { useAdminError } from "./useAdminError";

const PAGE_SIZE = 20;

/** All products (hidden ones too), newest edits first, with search and pages. */
export default function ProductList() {
  const { t, locale } = useTranslation();
  const toMessage = useAdminError();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminProductRow[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Wait until typing stops before searching.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    listAdminProducts({ search: query, page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((e) => active && setError(toMessage(e)));
    return () => {
      active = false;
    };
  }, [query, page, toMessage]);

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Typography variant="h1" color="burgundy">
          {t("admin.products")}
        </Typography>
        <Button href={localePath(locale, "/admin/product")} fullWidth="mobile">
          {t("admin.list.add")}
        </Button>
      </div>

      <TextField
        type="search"
        label={t("admin.list.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
      />

      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      )}
      {data && data.items.length === 0 && (
        <Typography color="muted" className="py-10 text-center">
          {query ? t("admin.list.noResults") : t("admin.list.empty")}
        </Typography>
      )}

      {data && data.items.length > 0 && (
        <>
          <Typography variant="bodySm" color="muted">
            {t("admin.list.total", { count: data.total })}
          </Typography>
          <ul className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
            {data.items.map((p) => (
              <li key={p.id}>
                <ProductRow product={p} />
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

function ProductRow({ product: p }: { product: AdminProductRow }) {
  const { t, locale } = useTranslation();
  const name = locale === "en" ? p.name_en : p.name_ar;
  const category = p.category ? (locale === "en" ? p.category.name_en : p.category.name_ar) : null;

  return (
    <Link
      href={localePath(locale, `/admin/product?id=${p.id}`)}
      className={`flex gap-3 rounded-brand bg-white p-2 shadow-sm transition-shadow hover:shadow-md ${
        p.is_active ? "" : "opacity-70"
      }`}
    >
      <div className="relative h-24 w-[4.75rem] shrink-0 overflow-hidden rounded-brand bg-leather">
        {p.cover && <Image src={p.cover} alt="" fill sizes="76px" className="object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
        <Typography variant="subtitle" as="span" className="truncate">
          {name}
        </Typography>
        {category && (
          <Typography variant="bodySm" color="muted" as="span">
            {category}
          </Typography>
        )}
        <Typography variant="bodySm" as="span">
          {p.minPrice != null ? t("admin.list.from", { price: p.minPrice.toLocaleString(locale) }) : t("admin.list.noVariants")}
        </Typography>
        <Typography variant="caption" color="muted">
          {t("admin.list.variants", { count: p.variantCount })} · {t("admin.list.stock", { count: p.totalStock })}
        </Typography>
        <span className="flex flex-wrap gap-1">
          {!p.is_active && <Chip size="small" label={t("admin.list.hidden")} />}
          {p.is_featured && <Chip size="small" color="secondary" label={t("admin.list.featured")} />}
        </span>
      </div>
    </Link>
  );
}
