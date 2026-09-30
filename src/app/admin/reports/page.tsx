import { ReportFilters, PrintReportButton } from "@/components/report-controls";
import { requireTenant } from "@/lib/tenants";

const TIME_ZONE = "Asia/Manila";
const PAGE_SIZE = 500;

type PaymentProof = {
  id: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  payer_name: string;
  submitted_at: string;
};

type PaymentMethod = {
  display_name: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
};

type ReportPayment = {
  id: string;
  mode: string;
  provider: string;
  provider_payment_id: string | null;
  status: string;
  amount_expected_minor: number;
  amount_received_minor: number | null;
  currency: string;
  transaction_reference: string | null;
  paid_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  venue_payment_methods: PaymentMethod | null;
  payment_proofs: PaymentProof[] | null;
};

type ReportBooking = {
  id: string;
  reference: string;
  status: string;
  starts_at: string;
  ends_at: string;
  hold_expires_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  player_count: number;
  amount_minor: number;
  currency: string;
  notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  courts: { name: string; surface: string | null } | null;
  locations: { name: string } | null;
  payments: ReportPayment[] | null;
};

function dateInManila(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function monthRange(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from, to: `${year}-${String(month).padStart(2, "0")}-${lastDay}` };
}

function reportRanges() {
  const today = dateInManila();
  const [year, month] = today.split("-").map(Number);
  const previous =
    month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  return {
    current: monthRange(year, month),
    previous: monthRange(previous.year, previous.month),
  };
}

function validDate(value: string | undefined) {
  return Boolean(
    value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00+08:00`)),
  );
}

function endExclusive(date: string) {
  return new Date(
    new Date(`${date}T00:00:00+08:00`).getTime() + 86_400_000,
  ).toISOString();
}

function money(amountMinor: number | null, currency = "PHP") {
  if (amountMinor === null) return "—";
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(
    amountMinor / 100,
  );
}

function dateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function label(value: string | null) {
  return value ? value.replaceAll("_", " ") : "—";
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { supabase, organization } = await requireTenant();
  const params = await searchParams;
  const ranges = reportRanges();
  let from = validDate(params.from) ? params.from! : ranges.current.from;
  let to = validDate(params.to) ? params.to! : ranges.current.to;
  if (from > to) [from, to] = [to, from];

  const start = new Date(`${from}T00:00:00+08:00`).toISOString();
  const finish = endExclusive(to);
  const bookings: ReportBooking[] = [];
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id,reference,status,starts_at,ends_at,hold_expires_at,customer_name,customer_email,customer_phone,player_count,amount_minor,currency,notes,confirmed_at,cancelled_at,created_at,courts(name,surface),locations(name),payments(id,mode,provider,provider_payment_id,status,amount_expected_minor,amount_received_minor,currency,transaction_reference,paid_at,approved_at,rejection_reason,created_at,venue_payment_methods(display_name,account_name,account_number,bank_name),payment_proofs(id,storage_path,mime_type,size_bytes,payer_name,submitted_at))",
      )
      .eq("organization_id", organization.id)
      .gte("starts_at", start)
      .lt("starts_at", finish)
      .order("starts_at", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) throw new Error("Unable to generate the booking report.");
    const rows = (data ?? []) as unknown as ReportBooking[];
    bookings.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    page += 1;
  }

  const proofPaths = bookings.flatMap((booking) =>
    (booking.payments ?? []).flatMap((payment) =>
      (payment.payment_proofs ?? []).map((proof) => proof.storage_path),
    ),
  );
  const proofUrlByPath = new Map<string, string>();
  const proofChunks: string[][] = [];
  for (let index = 0; index < proofPaths.length; index += 100) {
    proofChunks.push(proofPaths.slice(index, index + 100));
  }
  const signedProofGroups = await Promise.all(
    proofChunks.map((paths) =>
      supabase.storage.from("payment-proofs").createSignedUrls(paths, 3600),
    ),
  );
  signedProofGroups.forEach(({ data }) => {
    data?.forEach((item) => {
      if (item.path && item.signedUrl)
        proofUrlByPath.set(item.path, item.signedUrl);
    });
  });

  const payments = bookings.flatMap((booking) => booking.payments ?? []);
  const paidTotal = payments
    .filter((payment) => payment.status === "paid")
    .reduce(
      (total, payment) => total + (payment.amount_received_minor ?? 0),
      0,
    );
  const bookingTotal = bookings.reduce(
    (total, booking) => total + booking.amount_minor,
    0,
  );
  const awaitingReview = payments.filter(
    (payment) => payment.status === "proof_submitted",
  ).length;
  const confirmed = bookings.filter(
    (booking) => booking.status === "confirmed",
  ).length;

  return (
    <div className="report-page mx-auto max-w-[1600px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#235c43]">
            {organization.name}
          </p>
          <h1 className="display mt-2 text-3xl font-extrabold">
            Booking report
          </h1>
          <p className="mt-2 text-[#718076]">
            Bookings scheduled from {from} through {to}, in Manila time.
          </p>
        </div>
        <PrintReportButton />
      </div>

      <ReportFilters
        initialFrom={from}
        initialTo={to}
        currentMonth={ranges.current}
        previousMonth={ranges.previous}
      />

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Bookings", bookings.length.toLocaleString("en-PH")],
          ["Confirmed", confirmed.toLocaleString("en-PH")],
          ["Booking value", money(bookingTotal, organization.currency)],
          [
            "Paid / awaiting review",
            `${money(paidTotal, organization.currency)} / ${awaitingReview}`,
          ],
        ].map(([name, value]) => (
          <div
            key={name}
            className="rounded-2xl border border-[#dde3dc] bg-white p-4"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#718076]">
              {name}
            </p>
            <p className="mt-2 text-xl font-extrabold">{value}</p>
          </div>
        ))}
      </section>

      <section className="report-table mt-7 overflow-x-auto rounded-2xl border border-[#dde3dc] bg-white">
        <table className="w-full min-w-[1500px] border-collapse text-left text-xs">
          <thead className="bg-[#f7f9f5]">
            <tr>
              {[
                "Booking",
                "Schedule",
                "Customer",
                "Amount",
                "Payment details",
                "Proof of payment",
                "Booking timeline / notes",
              ].map((heading) => (
                <th
                  key={heading}
                  className="border-b border-[#dde3dc] p-3 align-top font-extrabold"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="break-inside-avoid border-b border-[#e5e9e4] last:border-0"
              >
                <td className="p-3 align-top">
                  <strong>{booking.reference}</strong>
                  <span className="mt-1 block capitalize">
                    {label(booking.status)}
                  </span>
                  <span className="mt-1 block text-[#718076]">
                    ID: {booking.id}
                  </span>
                </td>
                <td className="p-3 align-top">
                  <strong>{booking.courts?.name ?? "Unknown court"}</strong>
                  <span className="block">
                    {booking.locations?.name ?? "—"} ·{" "}
                    {booking.courts?.surface ?? "Surface not set"}
                  </span>
                  <span className="mt-1 block">
                    {dateTime(booking.starts_at)}
                  </span>
                  <span className="block">to {dateTime(booking.ends_at)}</span>
                  <span className="block text-[#718076]">
                    {Math.round(
                      (new Date(booking.ends_at).getTime() -
                        new Date(booking.starts_at).getTime()) /
                        3_600_000,
                    )}{" "}
                    hour(s)
                  </span>
                </td>
                <td className="p-3 align-top">
                  <strong>{booking.customer_name}</strong>
                  <a
                    className="block text-[#235c43] underline"
                    href={`mailto:${booking.customer_email}`}
                  >
                    {booking.customer_email}
                  </a>
                  <a
                    className="block text-[#235c43] underline"
                    href={`tel:${booking.customer_phone}`}
                  >
                    {booking.customer_phone}
                  </a>
                  <span className="mt-1 block">
                    Players: {booking.player_count}
                  </span>
                </td>
                <td className="p-3 align-top font-bold">
                  {money(booking.amount_minor, booking.currency)}
                </td>
                <td className="p-3 align-top">
                  {(booking.payments ?? []).length
                    ? (booking.payments ?? []).map((payment) => (
                        <div key={payment.id} className="mb-3 last:mb-0">
                          <strong>
                            {payment.venue_payment_methods?.display_name ??
                              payment.provider}
                          </strong>
                          <span className="block capitalize">
                            {label(payment.mode)} · {label(payment.status)}
                          </span>
                          <span className="block">
                            Provider: {payment.provider}
                          </span>
                          <span className="block">
                            Expected / received:{" "}
                            {money(
                              payment.amount_expected_minor,
                              payment.currency,
                            )}{" "}
                            /{" "}
                            {money(
                              payment.amount_received_minor,
                              payment.currency,
                            )}
                          </span>
                          <span className="block">
                            Transaction ref:{" "}
                            {payment.transaction_reference ?? "—"}
                          </span>
                          <span className="block">
                            Provider ref: {payment.provider_payment_id ?? "—"}
                          </span>
                          <span className="block">
                            Recipient:{" "}
                            {payment.venue_payment_methods?.account_name ?? "—"}{" "}
                            · {payment.venue_payment_methods?.bank_name ?? ""}{" "}
                            {payment.venue_payment_methods?.account_number ??
                              ""}
                          </span>
                          <span className="block">
                            Paid: {dateTime(payment.paid_at)} · Reviewed:{" "}
                            {dateTime(payment.approved_at)}
                          </span>
                          {payment.rejection_reason && (
                            <span className="block text-red-700">
                              Reason: {payment.rejection_reason}
                            </span>
                          )}
                        </div>
                      ))
                    : "No payment submitted"}
                </td>
                <td className="p-3 align-top">
                  {(booking.payments ?? []).flatMap(
                    (payment) => payment.payment_proofs ?? [],
                  ).length
                    ? (booking.payments ?? [])
                        .flatMap((payment) => payment.payment_proofs ?? [])
                        .map((proof) => (
                          <div key={proof.id} className="mb-3 last:mb-0">
                            <strong>{proof.payer_name}</strong>
                            <span className="block">
                              Uploaded: {dateTime(proof.submitted_at)}
                            </span>
                            <span className="block">
                              {proof.mime_type} ·{" "}
                              {(proof.size_bytes / 1_048_576).toFixed(2)} MB
                            </span>
                            {proofUrlByPath.get(proof.storage_path) ? (
                              <a
                                className="font-bold text-[#235c43] underline"
                                href={proofUrlByPath.get(proof.storage_path)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open proof
                              </a>
                            ) : (
                              <span className="text-[#718076]">
                                Proof file unavailable
                              </span>
                            )}
                          </div>
                        ))
                    : "No proof uploaded"}
                </td>
                <td className="p-3 align-top">
                  <span className="block">
                    Created: {dateTime(booking.created_at)}
                  </span>
                  <span className="block">
                    Hold expiry: {dateTime(booking.hold_expires_at)}
                  </span>
                  <span className="block">
                    Confirmed: {dateTime(booking.confirmed_at)}
                  </span>
                  <span className="block">
                    Cancelled: {dateTime(booking.cancelled_at)}
                  </span>
                  <span className="mt-1 block">
                    Notes: {booking.notes ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!bookings.length && (
          <p className="p-8 text-center text-[#718076]">
            No bookings are scheduled in this date range.
          </p>
        )}
      </section>
      <p className="mt-4 text-xs text-[#718076]">
        Generated {dateTime(new Date().toISOString())}. Proof links expire after
        one hour.
      </p>
    </div>
  );
}
