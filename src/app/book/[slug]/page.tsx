import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { TenantBooking } from "@/components/tenant-booking";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const getVenue = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const client = createAdminClient();
  const { data } = await client
    .from("organizations")
    .select(
      "id,name,slug,currency,timezone,initial_hold_minutes,max_booking_hours,is_active",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) return { title: "Venue not found" };
  const title = `Book a court at ${venue.name}`;
  const description = `View available courts and book your preferred time at ${venue.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/book/${venue.slug}` },
    openGraph: {
      title,
      description,
      url: new URL(`/book/${venue.slug}`, SITE_URL),
      type: "website",
    },
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await getVenue(slug);
  if (!venue) notFound();
  const client = createAdminClient();
  const [{ data: courts }, { data: methods }] = await Promise.all([
    client
      .from("courts")
      .select("id,name,surface,is_indoor,hourly_rate_minor")
      .eq("organization_id", venue.id)
      .eq("is_active", true)
      .order("sort_order"),
    client
      .from("venue_payment_methods")
      .select(
        "id,display_name,mode,provider,account_name,account_number,bank_name,instructions,connection_status",
      )
      .eq("organization_id", venue.id)
      .eq("is_enabled", true)
      .order("display_order"),
  ]);

  return (
    <TenantBooking
      venue={venue}
      courts={courts ?? []}
      methods={(methods ?? []).filter((method) => method.mode === "manual")}
    />
  );
}
