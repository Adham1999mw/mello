import AdminShell from "@/components/admin/AdminShell";
import DeliverySettings from "@/components/admin/DeliverySettings";

export { getStaticPaths, getStaticProps } from "@/i18n/static";

// /ar/admin/delivery/: Delivery & returns for the whole store.
export default function AdminDeliverySettingsPage() {
  return (
    <AdminShell>
      <DeliverySettings />
    </AdminShell>
  );
}
