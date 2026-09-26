import { describe, expect, it } from "vitest";
import { holdRequestSchema, isBlockingStatus } from "./booking";

const request = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  courtId: "22222222-2222-4222-8222-222222222222",
  startsAt: "2026-09-21T18:00:00+08:00",
  endsAt: "2026-09-21T19:00:00+08:00",
  customerName: "Mika Santos",
  customerEmail: "mika@example.com",
  customerPhone: "09171234567",
  playerCount: 2,
  amountMinor: 60000,
  currency: "PHP",
};

describe("booking domain", () => {
  it("accepts a valid one-hour hold", () =>
    expect(holdRequestSchema.safeParse(request).success).toBe(true));
  it("accepts a valid two-hour hold", () =>
    expect(
      holdRequestSchema.safeParse({
        ...request,
        endsAt: "2026-09-21T20:00:00+08:00",
      }).success,
    ).toBe(true));
  it("rejects a booking longer than two hours", () =>
    expect(
      holdRequestSchema.safeParse({
        ...request,
        endsAt: "2026-09-21T21:00:00+08:00",
      }).success,
    ).toBe(false));
  it("rejects a reversed interval", () =>
    expect(
      holdRequestSchema.safeParse({
        ...request,
        endsAt: "2026-09-21T17:00:00+08:00",
      }).success,
    ).toBe(false));
  it("only blocks availability for active reservation states", () => {
    expect(
      ["held", "pending_payment_review", "confirmed"].every(isBlockingStatus),
    ).toBe(true);
    expect(["expired", "cancelled", "rejected"].some(isBlockingStatus)).toBe(
      false,
    );
  });
});
