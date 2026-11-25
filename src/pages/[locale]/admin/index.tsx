import AdminShell from "@/components/admin/AdminShell";
import ProductList from "@/components/admin/ProductList";

export { getStaticPaths, getStaticProps } from "@/i18n/static";

// /ar/admin/ and /en/admin/: product list. Login is asked here if needed.
export default function AdminProductsPage() {
  return (
    <AdminShell>
      <ProductList />
    </AdminShell>
  );
}
