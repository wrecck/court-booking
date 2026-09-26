import { z } from "zod";

export const holdRequestSchema = z
  .object({
    organizationId: z.string().uuid(),
    courtId: z.string().uuid(),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.email(),
    customerPhone: z.string().trim().min(7).max(30),
    playerCount: z.number().int().min(1).max(20),
    amountMinor: z.number().int().nonnegative(),
    currency: z.string().length(3).default("PHP"),
  })
  .superRefine((value, context) => {
    const startsAt = new Date(value.startsAt).getTime();
    const endsAt = new Date(value.endsAt).getTime();
    if (endsAt <= startsAt)
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End time must be after start time.",
      });
    if (endsAt - startsAt > 2 * 60 * 60 * 1000)
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "A booking cannot exceed two hours.",
      });
  });

export const proofMetadataSchema = z.object({
  bookingToken: z.string().regex(/^[a-f0-9]{48}$/),
  paymentMethodId: z.string().uuid(),
  amountMinor: z.coerce.number().int().positive(),
  transactionReference: z.string().trim().min(3).max(100),
  payerName: z.string().trim().min(2).max(120),
});

export const allowedProofTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
export const maxProofSize = 10 * 1024 * 1024;

export function isBlockingStatus(status: string) {
  return (
    status === "held" ||
    status === "pending_payment_review" ||
    status === "confirmed"
  );
}
