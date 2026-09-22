"use server";

import { revalidatePath } from "next/cache";
import { requireOperator } from "@/lib/tenants";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateTenant(formData: FormData) {
  await requireOperator();
  const id = String(formData.get("id") ?? "");
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid venue.");
  const initial = Number(formData.get("initial"));
  const review = Number(formData.get("review"));
  if (!Number.isInteger(initial) || initial < 5 || initial > 60 || !Number.isInteger(review) || review < 10 || review > 1440) throw new Error("Invalid hold window.");
  const isActive = formData.get("active") === "on";
  const { error } = await createAdminClient().from("organizations").update({ is_active: isActive, initial_hold_minutes: initial, manual_review_minutes: review, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Unable to update venue.");
  revalidatePath("/platform");
}
