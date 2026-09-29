import { requireTenant } from "@/lib/tenants";
import { savePaymentMethod, updatePaymentSettings } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { PaymentMethodRow } from "@/components/payment-method-row";

export default async function PaymentSettingsPage() {
  const { supabase, organization, role } = await requireTenant();
  const [{ data: methods }, { data: settings }] = await Promise.all([
    supabase
      .from("venue_payment_methods")
      .select(
        "id,display_name,provider,account_name,account_number,bank_name,instructions,mode,connection_status,is_enabled",
      )
      .eq("organization_id", organization.id)
      .order("display_order"),
    supabase
      .from("organizations")
      .select("initial_hold_minutes,manual_review_minutes")
      .eq("id", organization.id)
      .single(),
  ]);
  const edit = ["owner", "admin", "platform_operator"].includes(role);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="display text-3xl font-extrabold">Payment settings</h1>
      <p className="mt-2 text-[#718076]">
        Configure how players pay {organization.name}. Personal GCash wallets
        use manual proof upload.
      </p>
      <div className="mt-7 grid gap-6">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Manual payment recipients</h2>
          <div className="mt-4 divide-y">
            {methods
              ?.filter((m) => m.mode === "manual")
              .map((method) =>
                edit ? (
                  <PaymentMethodRow key={method.id} method={method} />
                ) : (
                  <div key={method.id} className="py-4">
                    <strong>{method.display_name}</strong>
                    <p className="text-sm text-[#718076]">
                      {method.bank_name ? `${method.bank_name} · ` : ""}
                      {method.account_name} · {method.account_number}
                    </p>
                  </div>
                ),
              )}
            {!methods?.some((m) => m.mode === "manual") && (
              <p className="py-4 text-sm text-[#718076]">
                Add a GCash number or bank account to accept payments.
              </p>
            )}
          </div>
          {edit && (
            <form
              action={savePaymentMethod}
              className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2"
            >
              <select
                name="provider"
                required
                className="rounded-lg border p-3"
              >
                <option value="gcash">GCash</option>
                <option value="bank">Bank transfer</option>
              </select>
              <input
                name="displayName"
                required
                placeholder="Display name"
                className="rounded-lg border p-3"
              />
              <input
                name="accountName"
                required
                placeholder="Recipient name"
                className="rounded-lg border p-3"
              />
              <input
                name="accountNumber"
                required
                placeholder="Recipient number / account number"
                className="rounded-lg border p-3"
              />
              <input
                name="bankName"
                placeholder="Bank name (for bank transfers)"
                className="rounded-lg border p-3"
              />
              <input
                name="instructions"
                placeholder="Payment instructions"
                className="rounded-lg border p-3"
              />
              <SubmitButton
                pendingText="Adding…"
                className="rounded-lg bg-[#235c43] p-3 font-bold text-white disabled:opacity-60 sm:col-span-2"
              >
                Add payment method
              </SubmitButton>
            </form>
          )}
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Automatic GCash checkout</h2>
          <p className="mt-2 text-sm text-[#718076]">
            Available only after a verified business gateway is connected. This
            is currently disabled for your venue.
          </p>
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Booking holds</h2>
          {edit && (
            <form
              action={updatePaymentSettings}
              className="mt-4 flex flex-wrap items-end gap-3"
            >
              <label className="text-sm font-bold">
                Payment hold (minutes)
                <input
                  type="number"
                  name="initial"
                  min="5"
                  max="60"
                  defaultValue={settings?.initial_hold_minutes ?? 15}
                  className="mt-2 block rounded-lg border p-3"
                />
              </label>
              <label className="text-sm font-bold">
                Proof review (minutes)
                <input
                  type="number"
                  name="review"
                  min="10"
                  max="1440"
                  defaultValue={settings?.manual_review_minutes ?? 45}
                  className="mt-2 block rounded-lg border p-3"
                />
              </label>
              <SubmitButton
                pendingText="Saving…"
                className="rounded-lg bg-[#235c43] p-3 font-bold text-white disabled:opacity-60"
              >
                Save
              </SubmitButton>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
