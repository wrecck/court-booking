"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LegalFooter } from "@/components/legal-footer";

type Venue = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  initial_hold_minutes: number;
  max_booking_hours: number;
};
type Court = {
  id: string;
  name: string;
  surface: string | null;
  is_indoor: boolean;
  hourly_rate_minor: number;
};
type Method = {
  id: string;
  display_name: string;
  mode: string;
  provider: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  instructions: string | null;
};
type Occupied = { startsAt: string; endsAt: string };

function phDate(offset: number) {
  const today = new Date(Date.now() + 8 * 3600000 + offset * 86400000);
  return today.toISOString().slice(0, 10);
}

export function TenantBooking({
  venue,
  courts,
  methods,
}: {
  venue: Venue;
  courts: Court[];
  methods: Method[];
}) {
  const [currentTime] = useState(() => Date.now());
  const [day, setDay] = useState(() => phDate(0));
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [hour, setHour] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState(1);
  const [occupied, setOccupied] = useState<Occupied[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<{
    booking_id: string;
    reference: string;
    hold_expires_at: string;
    guest_token: string;
    court_name: string;
    payment_methods: Method[];
  } | null>(null);
  const availableMethods = booking?.payment_methods ?? methods;
  const [methodId, setMethodId] = useState(
    () => methods.find((method) => method.mode === "manual")?.id ?? "",
  );
  const [proof, setProof] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const court = courts.find((item) => item.id === courtId);
  const selectedMethod = availableMethods.find(
    (method) => method.id === methodId,
  );
  const totalAmountMinor = (court?.hourly_rate_minor ?? 0) * durationHours;
  const proofLabel =
    selectedMethod?.provider === "gcash"
      ? "Upload GCash proof"
      : selectedMethod
        ? `Upload ${selectedMethod.display_name} proof`
        : "Upload payment proof";
  const money = (value: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: venue.currency,
    }).format(value / 100);

  function isRangeBlocked(startHour: number, bookingHours: number) {
    const startsAt = new Date(
      `${day}T${String(startHour).padStart(2, "0")}:00:00+08:00`,
    ).getTime();

    return (
      startsAt < currentTime ||
      startHour + bookingHours > 22 ||
      occupied.some(
        (slot) =>
          startsAt < new Date(slot.endsAt).getTime() &&
          startsAt + bookingHours * 3600000 > new Date(slot.startsAt).getTime(),
      )
    );
  }

  function selectHour(selectedHour: number) {
    if (
      hour !== null &&
      durationHours === 1 &&
      venue.max_booking_hours >= 2 &&
      selectedHour === hour + 1 &&
      !isRangeBlocked(hour, 2)
    ) {
      setDurationHours(2);
      return;
    }

    if (
      hour !== null &&
      selectedHour > hour &&
      selectedHour < hour + durationHours
    ) {
      return;
    }

    setHour(selectedHour);
  }

  useEffect(() => {
    if (!courtId) return;
    const controller = new AbortController();
    void (async () => {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setAvailabilityLoading(true);
      setOccupied([]);
      setError("");
      try {
        const response = await fetch(
          `/api/tenant/${venue.slug}/availability?court=${courtId}&day=${day}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error ?? "Availability could not be loaded.");
        setOccupied(result.occupied ?? []);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Availability could not be loaded.",
          );
      } finally {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      }
    })();
    return () => controller.abort();
  }, [courtId, day, venue.slug]);

  async function hold(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!court || hour === null) return;
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const startsAt = new Date(
      `${day}T${String(hour).padStart(2, "0")}:00:00+08:00`,
    );
    try {
      const response = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: venue.id,
          courtId,
          startsAt: startsAt.toISOString(),
          endsAt: new Date(
            startsAt.getTime() + durationHours * 3600000,
          ).toISOString(),
          customerName: form.get("name"),
          customerEmail: form.get("email"),
          customerPhone: form.get("phone"),
          playerCount: 1,
          amountMinor: totalAmountMinor,
          currency: venue.currency,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Unable to hold this court.");
      setBooking(result.booking);
      setMethodId(
        result.booking.payment_methods?.find(
          (method: Method) => method.mode === "manual",
        )?.id ?? "",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Booking failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!booking || !court || !proof) return;
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    form.set("bookingToken", booking.guest_token);
    form.set("paymentMethodId", methodId);
    form.set("amountMinor", String(totalAmountMinor));
    form.set("proof", proof);
    try {
      const response = await fetch(
        `/api/bookings/${booking.booking_id}/proof`,
        { method: "POST", body: form },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Unable to submit proof.");
      setSubmitted(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Proof submission failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f2f5ef]">
      <header className="border-b bg-white px-5 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="display text-xl font-extrabold">{venue.name}</p>
            <p className="text-xs text-[#718076]">Court reservations</p>
          </div>
          <Link href="/" className="text-sm font-bold text-[#235c43]">
            Courtly
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 pb-32 pt-10 sm:pb-10">
        <h1 className="display text-4xl font-extrabold">Book a court</h1>
        <p className="mt-2 text-[#718076]">
          Choose a time and pay using one of the venue&apos;s available methods.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-[#fff0eb] p-4 text-[#a44b34]"
          >
            {error}
          </p>
        )}
        {!booking && (
          <p
            aria-live="polite"
            className="mt-6 rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-sm text-[#718076]"
          >
            {availabilityLoading
              ? `Checking ${court?.name ?? "court"} availability for ${day}…`
              : occupied.length
                ? `${occupied.length} booked or held ${occupied.length === 1 ? "slot" : "slots"} for ${court?.name} on ${day}.`
                : `No bookings for ${court?.name} on ${day} — all remaining slots are available.`}
          </p>
        )}
        {submitted ? (
          <section className="mt-8 rounded-2xl bg-white p-8">
            <h2 className="display text-2xl font-bold">
              Proof sent for review
            </h2>
            <p className="mt-3">
              <strong>{booking?.court_name}</strong> · Reference:{" "}
              <strong>{booking?.reference}</strong>. The venue will review your
              payment before confirming the court.
            </p>
          </section>
        ) : booking ? (
          <section className="mt-8 rounded-2xl bg-white p-6">
            <h2 className="display text-2xl font-bold">
              Court held · {booking.reference}
            </h2>
            <p className="mt-2 text-[#718076]">
              Court:{" "}
              <strong className="text-[#17231b]">{booking.court_name}</strong>.
              Hold expires{" "}
              {new Date(booking.hold_expires_at).toLocaleString("en-PH", {
                timeZone: venue.timezone,
              })}
              . {durationHours}-hour booking. Amount due:{" "}
              {money(totalAmountMinor)}.
            </p>
            {availableMethods.length ? (
              <form onSubmit={submitProof} className="mt-6 grid max-w-xl gap-4">
                <fieldset className="grid gap-3">
                  <legend className="mb-2 font-bold">Pay to your venue</legend>
                  {availableMethods
                    .filter((method) => method.mode === "manual")
                    .map((method) => (
                      <label
                        key={method.id}
                        className={`cursor-pointer rounded-xl border p-4 ${methodId === method.id ? "border-[#235c43] bg-[#eff6ef]" : ""}`}
                      >
                        <input
                          required
                          type="radio"
                          name="method"
                          value={method.id}
                          checked={methodId === method.id}
                          onChange={() => {
                            setMethodId(method.id);
                            setProof(null);
                          }}
                        />{" "}
                        <strong>{method.display_name}</strong>
                        <span className="mt-2 block text-sm">
                          {method.bank_name ? `${method.bank_name} · ` : ""}
                          {method.account_name} · {method.account_number}
                        </span>
                        {method.instructions && (
                          <span className="mt-1 block text-sm text-[#718076]">
                            {method.instructions}
                          </span>
                        )}
                      </label>
                    ))}
                </fieldset>
                {availableMethods.some((m) => m.mode === "manual") && (
                  <>
                    <label className="rounded-xl border border-[#c9d8cc] bg-[#f6faf6] p-4 font-bold">
                      {proofLabel}
                      <span className="mt-1 block text-sm font-normal text-[#718076]">
                        Choose a screenshot from your phone or attach a PDF
                        receipt.
                      </span>
                      <input
                        key={methodId}
                        type="file"
                        required
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={(event) =>
                          setProof(event.target.files?.[0] ?? null)
                        }
                        className="mt-3 block w-full rounded-lg border bg-white p-3"
                      />
                    </label>
                    <label className="font-bold">
                      Name on payment
                      <input
                        name="payerName"
                        required
                        minLength={2}
                        className="mt-2 block w-full rounded-lg border p-3"
                      />
                    </label>
                    <label className="font-bold">
                      Transaction reference
                      <input
                        name="transactionReference"
                        required
                        minLength={3}
                        className="mt-2 block w-full rounded-lg border p-3"
                      />
                    </label>
                    <button
                      disabled={loading || !methodId || !proof}
                      className="sticky bottom-4 z-10 rounded-xl bg-[#235c43] p-4 font-bold text-white shadow-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <LoaderCircle className="size-5 animate-spin" />
                          Submitting…
                        </span>
                      ) : (
                        `Submit ${selectedMethod?.provider === "gcash" ? "GCash " : ""}proof`
                      )}
                    </button>
                  </>
                )}
              </form>
            ) : (
              <p className="mt-6 rounded-xl bg-[#fff7df] p-4">
                Payment setup is still in progress. Contact the venue and quote
                your booking reference before this hold expires.
              </p>
            )}
          </section>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="rounded-2xl bg-white p-6">
              <h2 className="display text-xl font-bold">Choose your slot</h2>
              <label className="mt-5 block font-bold">
                Day
                <input
                  type="date"
                  min={phDate(0)}
                  max={phDate(60)}
                  value={day}
                  onChange={(event) => {
                    setDay(event.target.value);
                    setHour(null);
                  }}
                  className="mt-2 block rounded-xl border p-3"
                />
              </label>
              <fieldset className="mt-6">
                <legend className="font-bold">Duration</legend>
                <div className="mt-2 flex gap-2">
                  {Array.from(
                    { length: venue.max_booking_hours },
                    (_, index) => index + 1,
                  ).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setDurationHours(value);
                        setHour(null);
                      }}
                      className={`rounded-xl border px-5 py-3 text-sm font-bold ${durationHours === value ? "border-[#235c43] bg-[#235c43] text-white" : "border-[#dfe5dc]"}`}
                    >
                      {value} {value === 1 ? "hour" : "hours"}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {courts.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setCourtId(item.id);
                      setHour(null);
                    }}
                    className={`rounded-xl border p-4 text-left ${courtId === item.id ? "border-[#235c43] bg-[#eff6ef]" : ""}`}
                  >
                    <strong>{item.name}</strong>
                    <span className="mt-1 block text-sm text-[#718076]">
                      {item.surface ?? "Court"} ·{" "}
                      {money(item.hourly_rate_minor)} / hour
                    </span>
                  </button>
                ))}
              </div>
              <h3 className="mt-7 font-bold">
                Available start times · {durationHours}{" "}
                {durationHours === 1 ? "hour" : "hours"}
              </h3>
              {venue.max_booking_hours >= 2 && (
                <p className="mt-1 text-sm text-[#718076]">
                  Select a start time, then tap the next hour to extend the
                  booking to two hours.
                </p>
              )}
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {Array.from({ length: 15 }, (_, index) => index + 7).map(
                  (item) => {
                    const startsAt = new Date(
                      `${day}T${String(item).padStart(2, "0")}:00:00+08:00`,
                    ).getTime();
                    const blocked = isRangeBlocked(item, durationHours);
                    const selected =
                      hour !== null &&
                      item >= hour &&
                      item < hour + durationHours;
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={blocked}
                        onClick={() => selectHour(item)}
                        className={`rounded-xl border p-3 text-sm font-bold ${selected ? "border-[#235c43] bg-[#235c43] text-white" : blocked ? "bg-gray-100 text-gray-400" : "hover:border-[#235c43]"}`}
                      >
                        {new Date(startsAt).toLocaleTimeString("en-PH", {
                          timeZone: "Asia/Manila",
                          hour: "numeric",
                        })}
                      </button>
                    );
                  },
                )}
              </div>
            </section>
            <form onSubmit={hold} className="h-fit rounded-2xl bg-white p-6">
              <h2 className="display text-xl font-bold">Your booking</h2>
              <p className="mt-3 text-sm text-[#718076]">
                {court?.name ?? "Select a court"} · {day}{" "}
                {hour !== null
                  ? `at ${hour}:00 for ${durationHours} ${durationHours === 1 ? "hour" : "hours"}`
                  : ""}
              </p>
              <p className="mt-2 text-2xl font-extrabold">
                {money(totalAmountMinor)}
              </p>
              <div className="mt-5 grid gap-3">
                <label className="text-sm font-bold">
                  Full name
                  <input
                    name="name"
                    required
                    minLength={2}
                    autoComplete="name"
                    className="mt-2 block w-full rounded-xl border p-3"
                  />
                </label>
                <label className="text-sm font-bold">
                  Email
                  <input
                    name="email"
                    required
                    type="email"
                    autoComplete="email"
                    className="mt-2 block w-full rounded-xl border p-3"
                  />
                </label>
                <label className="text-sm font-bold">
                  Mobile number
                  <input
                    name="phone"
                    required
                    minLength={7}
                    type="tel"
                    autoComplete="tel"
                    className="mt-2 block w-full rounded-xl border p-3"
                  />
                </label>
              </div>
              <button
                disabled={hour === null || loading || !courts.length}
                className="mt-5 w-full rounded-xl bg-[#235c43] p-4 font-bold text-white disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <LoaderCircle className="size-5 animate-spin" />
                    Holding…
                  </span>
                ) : (
                  "Hold slot & continue"
                )}
              </button>
              <p className="mt-3 text-xs text-[#718076]">
                Your slot is held when you continue, including during manual
                payment. By continuing, you agree to the{" "}
                <Link className="underline" href="/terms">
                  Terms
                </Link>{" "}
                and acknowledge the{" "}
                <Link className="underline" href="/privacy">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        )}
        <div className="mt-12 border-t border-[#dfe5dc] pt-6">
          <LegalFooter />
        </div>
      </div>
    </main>
  );
}
