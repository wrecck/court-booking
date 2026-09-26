import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const court = url.searchParams.get("court");
  const day = url.searchParams.get("day");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !/^[a-f0-9-]{36}$/.test(court ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(day ?? "")) return Response.json({ error: "Invalid request." }, { status: 400 });
  const start = new Date(`${day}T00:00:00+08:00`);
  if (Number.isNaN(start.getTime()) || Math.abs(start.getTime() - Date.now()) > 90 * 86400000) return Response.json({ error: "Invalid date." }, { status: 400 });
  const client = createAdminClient();
  const { data: venue } = await client.from("organizations").select("id").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!venue) return Response.json({ error: "Venue not found." }, { status: 404 });
  const { data: selectedCourt } = await client.from("courts").select("id").eq("id", court).eq("organization_id", venue.id).eq("is_active", true).maybeSingle();
  if (!selectedCourt) return Response.json({ error: "Court not found." }, { status: 404 });
  const { data, error } = await client.from("bookings").select("starts_at,ends_at,status,hold_expires_at")
    .eq("court_id", court).in("status", ["held", "pending_payment_review", "confirmed"])
    .lt("starts_at", new Date(start.getTime() + 86400000).toISOString())
    .gt("ends_at", start.toISOString());
  if (error) return Response.json({ error: "Unable to load availability." }, { status: 500 });
  return Response.json(
    { occupied: data?.filter((b) => b.status === "confirmed" || (b.hold_expires_at && new Date(b.hold_expires_at).getTime() > Date.now())).map((b) => ({ startsAt: b.starts_at, endsAt: b.ends_at })) ?? [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
