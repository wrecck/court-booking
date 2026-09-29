"use client";

import { useState } from "react";
import {
  deletePaymentMethod,
  togglePaymentMethod,
  updatePaymentMethod,
} from "@/app/admin/settings/payments/actions";
import { SubmitButton } from "@/components/submit-button";

type PaymentMethod = {
  id: string;
  display_name: string;
  provider: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  instructions: string | null;
  is_enabled: boolean;
};

export function PaymentMethodRow({ method }: { method: PaymentMethod }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <strong>{method.display_name}</strong>
          <p className="text-sm text-[#718076]">
            {method.bank_name ? `${method.bank_name} · ` : ""}
            {method.account_name} · {method.account_number}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={togglePaymentMethod}>
            <input type="hidden" name="id" value={method.id} />
            <input
              type="hidden"
              name="enabled"
              value={String(!method.is_enabled)}
            />
            <SubmitButton
              pendingText={method.is_enabled ? "Disabling…" : "Enabling…"}
              className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-60"
            >
              {method.is_enabled ? "Disable" : "Enable"}
            </SubmitButton>
          </form>
          <button
            type="button"
            aria-expanded={editing}
            onClick={() => setEditing((current) => !current)}
            className="rounded-lg border px-3 py-2 text-sm font-bold"
          >
            {editing ? "Cancel edit" : "Edit"}
          </button>
          <form action={deletePaymentMethod}>
            <input type="hidden" name="id" value={method.id} />
            <SubmitButton
              pendingText="Deleting…"
              confirmMessage={`Delete ${method.display_name}? This cannot be undone.`}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-60"
            >
              Delete
            </SubmitButton>
          </form>
        </div>
      </div>

      {editing && (
        <form
          action={async (formData) => {
            await updatePaymentMethod(formData);
            setEditing(false);
          }}
          className="mt-4 grid gap-3 rounded-xl bg-[#f5f7f2] p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={method.id} />
          <select
            name="provider"
            required
            defaultValue={method.provider === "gcash" ? "gcash" : "bank"}
            className="rounded-lg border bg-white p-3"
          >
            <option value="gcash">GCash</option>
            <option value="bank">Bank transfer</option>
          </select>
          <input
            name="displayName"
            required
            minLength={3}
            maxLength={80}
            defaultValue={method.display_name}
            placeholder="Display name"
            className="rounded-lg border bg-white p-3"
          />
          <input
            name="accountName"
            required
            minLength={2}
            defaultValue={method.account_name ?? ""}
            placeholder="Recipient name"
            className="rounded-lg border bg-white p-3"
          />
          <input
            name="accountNumber"
            required
            minLength={5}
            defaultValue={method.account_number ?? ""}
            placeholder="Recipient number / account number"
            className="rounded-lg border bg-white p-3"
          />
          <input
            name="bankName"
            defaultValue={method.bank_name ?? ""}
            placeholder="Bank name (for bank transfers)"
            className="rounded-lg border bg-white p-3"
          />
          <input
            name="instructions"
            defaultValue={method.instructions ?? ""}
            placeholder="Payment instructions"
            className="rounded-lg border bg-white p-3"
          />
          <SubmitButton
            pendingText="Saving changes…"
            className="rounded-lg bg-[#235c43] p-3 font-bold text-white disabled:opacity-60 sm:col-span-2"
          >
            Save changes
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
