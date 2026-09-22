import { requireTenant } from "@/lib/tenants";

export default async function BookingsPage() {
  const { supabase, organization } = await requireTenant();
  const { data: bookings } = await supabase.from("bookings").select("id,reference,customer_name,customer_email,status,starts_at,ends_at,courts(name)")
    .eq("organization_id", organization.id).order("starts_at", { ascending: false }).limit(100);
  return <div className="mx-auto max-w-7xl"><h1 className="display text-3xl font-extrabold">{organization.name} bookings</h1><p className="mt-2 text-[#718076]">Recent reservations and payment holds</p><section className="mt-7 overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#fafbf9]"><tr>{["Reference", "Player", "Court", "Starts", "Status"].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead><tbody>{bookings?.map((booking) => <tr key={booking.id} className="border-t"><td className="p-4 font-bold">{booking.reference}</td><td className="p-4">{booking.customer_name}<span className="block text-xs text-[#718076]">{booking.customer_email}</span></td><td className="p-4">{(booking.courts as unknown as { name: string } | null)?.name}</td><td className="p-4">{new Date(booking.starts_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</td><td className="p-4 capitalize">{booking.status.replaceAll("_", " ")}</td></tr>)}</tbody></table>{!bookings?.length && <p className="p-6 text-[#718076]">No reservations yet.</p>}</section></div>;
}
