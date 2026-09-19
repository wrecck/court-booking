"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reviewManualPayment(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "Payment could not be verified.");
  if (!paymentId || !["approve", "reject"].includes(decision)) throw new Error("Invalid review request.");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) throw new Error("Authentication required.");
  const { error } = await supabase.rpc("review_manual_payment", {
    p_payment_id: paymentId,
    p_approve: decision === "approve",
    p_reason: decision === "reject" ? reason : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
}
