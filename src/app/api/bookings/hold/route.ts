import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { holdRequestSchema } from "@/lib/domain/booking";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const parsed = holdRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid booking details.", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;
  const supabase = createAdminClient();
  const { data: court } = await supabase.from("courts").select("hourly_rate_minor,organization_id,is_active").eq("id", input.courtId).eq("organization_id", input.organizationId).eq("is_active", true).maybeSingle();
  const { data: venue } = await supabase.from("organizations").select("currency,is_active").eq("id", input.organizationId).eq("is_active", true).maybeSingle();
  if (!court || !venue) return Response.json({ error: "Venue or court not found." }, { status: 404 });
  const duration = new Date(input.endsAt).getTime() - new Date(input.startsAt).getTime();
  if (new Date(input.startsAt).getTime() <= Date.now() || duration !== 3600000) return Response.json({ error: "Choose a future one-hour slot." }, { status: 400 });
  const { data, error } = await supabase.rpc("create_booking_hold", {
    p_organization_id: input.organizationId,
    p_court_id: input.courtId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_player_count: input.playerCount,
    p_amount_minor: court.hourly_rate_minor,
    p_currency: venue.currency,
  });
  if (error) {
    const conflict = error.message.includes("slot_unavailable") || error.code === "23P01";
    return Response.json({ error: conflict ? "This slot has just been reserved." : "Unable to hold the court." }, { status: conflict ? 409 : 500 });
  }
  return Response.json({ booking: Array.isArray(data) ? data[0] : data }, { status: 201 });
}
