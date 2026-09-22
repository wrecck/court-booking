import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TenantBooking } from "@/components/tenant-booking";

export const dynamic = "force-dynamic";

export default async function TenantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  const client = createAdminClient();
  const { data: venue } = await client.from("organizations")
    .select("id,name,slug,currency,timezone,initial_hold_minutes,is_active").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!venue) notFound();
  const [{ data: courts }, { data: methods }] = await Promise.all([
    client.from("courts").select("id,name,surface,is_indoor,hourly_rate_minor").eq("organization_id", venue.id).eq("is_active", true).order("sort_order"),
    client.from("venue_payment_methods").select("id,display_name,mode,provider,account_name,account_number,bank_name,instructions,connection_status")
      .eq("organization_id", venue.id).eq("is_enabled", true).order("display_order"),
  ]);
  return <TenantBooking venue={venue} courts={courts ?? []} methods={(methods ?? []).filter((m) => m.mode === "manual")} />;
}
