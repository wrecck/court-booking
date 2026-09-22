import { AdminShell } from "@/components/admin-shell";
import { requireTenant } from "@/lib/tenants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { organization, user, supabase } = await requireTenant();
  const { data: operator } = await supabase.from("platform_operators").select("user_id").eq("user_id", user.id).maybeSingle();
  return <AdminShell venueName={organization.name} venueSlug={organization.slug} operator={Boolean(operator)}>{children}</AdminShell>;
}
