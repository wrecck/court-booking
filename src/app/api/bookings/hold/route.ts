import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { holdRequestSchema } from "@/lib/domain/booking";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return Response.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }
  const parsed = holdRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid booking details.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const supabase = createAdminClient();
  const [
    { data: court },
    { data: venue },
    { data: paymentMethods, error: paymentMethodsError },
  ] = await Promise.all([
    supabase
      .from("courts")
      .select("name,hourly_rate_minor,organization_id,is_active")
      .eq("id", input.courtId)
      .eq("organization_id", input.organizationId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("currency,is_active,max_booking_hours")
      .eq("id", input.organizationId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("venue_payment_methods")
      .select(
        "id,display_name,mode,provider,account_name,account_number,bank_name,instructions",
      )
      .eq("organization_id", input.organizationId)
      .eq("mode", "manual")
      .eq("is_enabled", true)
      .order("display_order"),
  ]);
  if (!court || !venue)
    return Response.json(
      { error: "Venue or court not found." },
      { status: 404 },
    );
  const duration =
    new Date(input.endsAt).getTime() - new Date(input.startsAt).getTime();
  const durationHours = duration / 3600000;
  if (
    new Date(input.startsAt).getTime() <= Date.now() ||
    !Number.isInteger(durationHours) ||
    durationHours < 1 ||
    durationHours > venue.max_booking_hours
  ) {
    return Response.json(
      {
        error: `Choose a future booking of up to ${venue.max_booking_hours} ${venue.max_booking_hours === 1 ? "hour" : "hours"}.`,
      },
      { status: 400 },
    );
  }
  if (paymentMethodsError) {
    return Response.json(
      { error: "Payment details could not be loaded." },
      { status: 500 },
    );
  }
  const { data, error } = await supabase.rpc("create_booking_hold", {
    p_organization_id: input.organizationId,
    p_court_id: input.courtId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_player_count: input.playerCount,
    p_amount_minor: court.hourly_rate_minor * durationHours,
    p_currency: venue.currency,
  });
  if (error) {
    const conflict =
      error.message.includes("slot_unavailable") || error.code === "23P01";
    return Response.json(
      {
        error: conflict
          ? "This slot has just been reserved."
          : "Unable to hold the court.",
      },
      { status: conflict ? 409 : 500 },
    );
  }

  const booking = Array.isArray(data) ? data[0] : data;
  return Response.json(
    {
      booking: {
        ...booking,
        court_name: court.name,
        payment_methods: paymentMethods ?? [],
      },
    },
    { status: 201 },
  );
}
