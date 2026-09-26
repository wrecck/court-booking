"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenants";

export async function saveCourt(formData: FormData) {
  const { supabase, organization, role } = await requireTenant();
  if (!["owner", "admin"].includes(role))
    throw new Error("Only venue admins can edit courts.");
  const name = String(formData.get("name") ?? "").trim();
  const surface = String(formData.get("surface") ?? "").trim();
  const rate = Number(formData.get("rate"));
  const id = String(formData.get("id") ?? "");
  if (
    name.length < 2 ||
    name.length > 80 ||
    !Number.isInteger(rate) ||
    rate < 0 ||
    rate > 100000
  )
    throw new Error("Invalid court details.");
  const values = {
    name,
    surface,
    hourly_rate_minor: rate * 100,
    is_active: formData.get("active") === "on",
  };
  if (id) {
    const { error } = await supabase
      .from("courts")
      .update(values)
      .eq("id", id)
      .eq("organization_id", organization.id);
    if (error) throw new Error("Unable to save court.");
  } else {
    const { data: location } = await supabase
      .from("locations")
      .select("id")
      .eq("organization_id", organization.id)
      .limit(1)
      .single();
    if (!location) throw new Error("Venue location missing.");
    const { error } = await supabase
      .from("courts")
      .insert({
        ...values,
        organization_id: organization.id,
        location_id: location.id,
      });
    if (error) throw new Error("Unable to add court.");
  }
  revalidatePath("/admin/settings/courts");
  revalidatePath(`/tenant/${organization.slug}`);
}

export async function saveBookingRules(formData: FormData) {
  const { supabase, organization, role } = await requireTenant();
  if (!["owner", "admin"].includes(role))
    throw new Error("Only venue admins can edit booking rules.");
  const maxBookingHours = Number(formData.get("maxBookingHours"));
  if (
    !Number.isInteger(maxBookingHours) ||
    maxBookingHours < 1 ||
    maxBookingHours > 2
  )
    throw new Error("Maximum booking duration must be one or two hours.");
  const { error } = await supabase
    .from("organizations")
    .update({ max_booking_hours: maxBookingHours })
    .eq("id", organization.id);
  if (error) throw new Error("Unable to save booking rules.");
  revalidatePath("/admin/settings/courts");
  revalidatePath(`/tenant/${organization.slug}`);
}
