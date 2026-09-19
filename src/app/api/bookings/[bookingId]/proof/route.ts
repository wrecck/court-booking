import { randomUUID } from "node:crypto";
import { allowedProofTypes, maxProofSize, proofMetadataSchema } from "@/lib/domain/booking";
import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  const { bookingId } = await context.params;
  const formData = await request.formData();
  const file = formData.get("proof");
  const parsed = proofMetadataSchema.safeParse({
    bookingToken: formData.get("bookingToken"),
    paymentMethodId: formData.get("paymentMethodId"),
    amountMinor: formData.get("amountMinor"),
    transactionReference: formData.get("transactionReference"),
    payerName: formData.get("payerName"),
  });
  if (!(file instanceof File) || !parsed.success) return Response.json({ error: "Proof and payment details are required." }, { status: 400 });
  if (!allowedProofTypes.has(file.type) || file.size > maxProofSize) return Response.json({ error: "Use a JPG, PNG, WebP, or PDF up to 10 MB." }, { status: 400 });

  const supabase = createAdminClient();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const objectPath = `pending/${bookingId}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(objectPath, file, { contentType: file.type, upsert: false });
  if (uploadError) return Response.json({ error: "Proof upload failed." }, { status: 500 });

  const { data, error } = await supabase.rpc("submit_manual_payment_proof", {
    p_booking_id: bookingId,
    p_guest_token: parsed.data.bookingToken,
    p_payment_method_id: parsed.data.paymentMethodId,
    p_amount_minor: parsed.data.amountMinor,
    p_transaction_reference: parsed.data.transactionReference,
    p_payer_name: parsed.data.payerName,
    p_storage_path: objectPath,
    p_mime_type: file.type,
    p_size_bytes: file.size,
  });
  if (error) {
    await supabase.storage.from("payment-proofs").remove([objectPath]);
    return Response.json({ error: "The hold expired or the proof could not be attached." }, { status: 409 });
  }
  return Response.json({ submission: Array.isArray(data) ? data[0] : data }, { status: 201 });
}
