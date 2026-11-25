import AdminShell from "@/components/admin/AdminShell";
import OptionsEditor from "@/components/admin/OptionsEditor";

export { getStaticPaths, getStaticProps } from "@/i18n/static";

// /ar/admin/settings/: categories, colors and sizes.
export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <OptionsEditor />
    </AdminShell>
  );
}
