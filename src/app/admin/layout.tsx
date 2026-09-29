import { AdminShell } from "@/components/admin-shell";
import { requireTenant } from "@/lib/tenants";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization, operator, tenants } = await requireTenant();
  return (
    <AdminShell
      venueId={organization.id}
      venueName={organization.name}
      venueSlug={organization.slug}
      operator={operator}
      tenants={tenants}
    >
      {children}
    </AdminShell>
  );
}
