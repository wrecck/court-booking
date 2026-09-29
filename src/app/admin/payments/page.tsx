import { createAdminClient } from "@/lib/supabase/admin";
import { requireTenant } from "@/lib/tenants";
import { SubmitButton } from "@/components/submit-button";
import { reviewManualPayment } from "./actions";

export default async function PaymentReviewPage() {
  const { supabase, organization } = await requireTenant();
  const { data: payments, error } = await supabase
    .from("payments")
    .select(
      "id,amount_expected_minor,transaction_reference,created_at,bookings(reference,customer_name,starts_at),payment_proofs(storage_path,payer_name),venue_payment_methods(display_name)",
    )
    .eq("organization_id", organization.id)
    .eq("status", "proof_submitted")
    .order("created_at", { ascending: true });
  if (error) throw new Error("Unable to load payment reviews.");
  const admin = createAdminClient();
  const proofs = await Promise.all(
    (payments ?? []).map(async (payment) => {
      const proof = (
        payment.payment_proofs as unknown as
          { storage_path: string; payer_name: string }[] | null
      )?.[0];
      const { data } = proof
        ? await admin.storage
            .from("payment-proofs")
            .createSignedUrl(proof.storage_path, 300)
        : { data: null };
      return { ...payment, proof, proofUrl: data?.signedUrl };
    }),
  );
  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-extrabold uppercase tracking-widest text-[#235c43]">
        {organization.name}
      </p>
      <h1 className="display mt-2 text-3xl font-extrabold">Payment review</h1>
      <p className="mt-2 text-[#718076]">
        Verify transfers before confirming a booking.
      </p>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {proofs.map((payment) => {
          const booking = payment.bookings as unknown as {
            reference: string;
            customer_name: string;
            starts_at: string;
          } | null;
          const method = payment.venue_payment_methods as unknown as {
            display_name: string;
          } | null;
          return (
            <article
              key={payment.id}
              className="rounded-2xl border bg-white p-6"
            >
              <h2 className="text-xl font-bold">
                {booking?.reference} · {booking?.customer_name}
              </h2>
              <p className="mt-3 text-sm">
                {method?.display_name} · ₱
                {(payment.amount_expected_minor / 100).toLocaleString("en-PH")}
              </p>
              <p className="mt-2 text-sm">
                Reference: {payment.transaction_reference}
              </p>
              <p className="mt-2 text-sm">
                Player: {payment.proof?.payer_name}
              </p>
              <p className="mt-2 text-sm">
                Booking:{" "}
                {booking?.starts_at &&
                  new Date(booking.starts_at).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                  })}
              </p>
              {payment.proofUrl && (
                <a
                  className="mt-5 inline-block font-bold text-[#235c43] underline"
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open uploaded proof
                </a>
              )}
              <form action={reviewManualPayment} className="mt-6 grid gap-3">
                <input type="hidden" name="paymentId" value={payment.id} />
                <label className="text-sm">
                  Reason if rejecting
                  <input
                    name="reason"
                    placeholder="Payment not received"
                    className="mt-1 block w-full rounded-lg border p-2"
                  />
                </label>
                <div className="flex gap-3">
                  <SubmitButton
                    name="decision"
                    value="reject"
                    pendingText="Processing…"
                    className="rounded-xl border border-red-300 px-4 py-2 font-bold text-red-800"
                  >
                    Reject
                  </SubmitButton>
                  <SubmitButton
                    name="decision"
                    value="approve"
                    pendingText="Processing…"
                    className="rounded-xl bg-[#235c43] px-4 py-2 font-bold text-white"
                  >
                    Confirm payment
                  </SubmitButton>
                </div>
              </form>
            </article>
          );
        })}
        {!proofs.length && (
          <p className="rounded-2xl bg-white p-8 text-[#718076]">
            No payments awaiting review.
          </p>
        )}
      </div>
    </div>
  );
}
