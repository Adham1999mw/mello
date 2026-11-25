import { useRouter } from "next/router";
import AdminShell from "@/components/admin/AdminShell";
import ProductEditor from "@/components/admin/ProductEditor";

export { getStaticPaths, getStaticProps } from "@/i18n/static";

// /ar/admin/product/ = new product, /ar/admin/product/?id=12 = edit product 12.
// The id is a query parameter (not /product/12/) so the page works as one static file
// on GitHub Pages.
export default function AdminProductPage() {
  const { query, isReady } = useRouter();
  const id = Number(query.id);
  return (
    <AdminShell>
      {isReady && <ProductEditor key={String(query.id ?? "new")} id={Number.isInteger(id) && id > 0 ? id : null} />}
    </AdminShell>
  );
}
