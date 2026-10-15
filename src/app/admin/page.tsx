import Link from "next/link";
import { requireTenant } from "@/lib/tenants";

export default async function AdminOverview() {
  const { supabase, organization } = await requireTenant();
  const [{ count: courts }, { data: bookings }, { count: payments }] =
    await Promise.all([
      supabase
        .from("courts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id),
      supabase
        .from("bookings")
        .select("id,reference,customer_name,status,starts_at,amount_minor")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("status", "proof_submitted"),
    ]);
  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-extrabold uppercase tracking-widest text-[#235c43]">
        Venue overview
      </p>
      <h1 className="display mt-2 text-4xl font-extrabold">
        {organization.name}
      </h1>
      <p className="mt-2 text-[#6f7a72]">
        Share your public booking page:{" "}
        <Link
          className="font-bold text-[#235c43] underline"
          href={`/book/${organization.slug}`}
        >
          /book/{organization.slug}
        </Link>
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Courts", courts ?? 0],
          ["Recent bookings", bookings?.length ?? 0],
          ["Proofs to review", payments ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-6">
            <p className="text-sm text-[#718076]">{label}</p>
            <p className="display mt-2 text-3xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>
      <section className="mt-7 rounded-2xl border bg-white p-6">
        <h2 className="display text-xl font-bold">Recent bookings</h2>
        <div className="mt-4 divide-y">
          {bookings?.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <strong>{booking.reference}</strong>
                <p className="text-sm text-[#718076]">
                  {booking.customer_name} ·{" "}
                  {new Date(booking.starts_at).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                  })}
                </p>
              </div>
              <span className="text-sm font-bold capitalize">
                {booking.status.replaceAll("_", " ")}
              </span>
            </div>
          ))}
          {!bookings?.length && (
            <p className="py-4 text-[#718076]">
              No bookings yet. Share your booking page with your players.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
