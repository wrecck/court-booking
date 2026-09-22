"use server";

import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenants";

export async function savePaymentMethod(formData: FormData) {
  const { supabase, organization, role } = await requireTenant();
  if (!['owner', 'admin'].includes(role)) throw new Error("Only venue admins can change payment settings.");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const provider = String(formData.get("provider") ?? "");
  const type = provider === "gcash" ? "ewallet" : "bank_transfer";
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  if (displayName.length < 3 || displayName.length > 80 || !/^(gcash|bank)$/.test(provider) || accountName.length < 2 || accountNumber.length < 5) throw new Error("Complete the payment recipient details.");
  const { error } = await supabase.from("venue_payment_methods").insert({ organization_id: organization.id, display_name: displayName, provider, type, mode: "manual", account_name: accountName, account_number: accountNumber, bank_name: provider === "bank" ? String(formData.get("bankName") ?? "").trim() : null, instructions: String(formData.get("instructions") ?? "").trim(), is_enabled: true });
  if (error) throw new Error("Unable to add payment method.");
  revalidatePath("/admin/settings/payments"); revalidatePath(`/tenant/${organization.slug}`);
}

export async function updatePaymentSettings(formData: FormData) {
  const { supabase, organization, role } = await requireTenant();
  if (!['owner', 'admin'].includes(role)) throw new Error("Only venue admins can change payment settings.");
  const initial = Number(formData.get("initial"));
  const review = Number(formData.get("review"));
  if (!Number.isInteger(initial) || initial < 5 || initial > 60 || !Number.isInteger(review) || review < 10 || review > 1440) throw new Error("Invalid hold window.");
  const { error } = await supabase.from("organizations").update({ initial_hold_minutes: initial, manual_review_minutes: review }).eq("id", organization.id);
  if (error) throw new Error("Unable to save settings.");
  revalidatePath("/admin/settings/payments");
}

export async function togglePaymentMethod(formData: FormData) {
  const { supabase, organization, role } = await requireTenant();
  if (!['owner', 'admin'].includes(role)) throw new Error("Only venue admins can change payment settings.");
  const id = String(formData.get("id") ?? "");
  const enabled = formData.get("enabled") === "true";
  const { error } = await supabase.from("venue_payment_methods").update({ is_enabled: enabled }).eq("id", id).eq("organization_id", organization.id).eq("mode", "manual");
  if (error) throw new Error("Unable to update payment method.");
  revalidatePath("/admin/settings/payments"); revalidatePath(`/tenant/${organization.slug}`);
}
