import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeRegistration } from "../actions";

export default async function CompletePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/register/complete");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (membership) redirect("/admin");
  const { error } = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[#173f2c] px-5"><section className="w-full max-w-md rounded-3xl bg-white p-8"><h1 className="display text-3xl font-extrabold">Finish venue setup</h1><p className="mt-2 text-sm text-[#707b73]">Your email is confirmed. Choose the name and booking URL for your venue.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-[#fff0eb] p-3 text-sm text-[#9c442e]">{error}</p>}<form action={completeRegistration} className="mt-6 space-y-4"><label className="block text-sm font-bold">Venue name<input name="name" required minLength={2} maxLength={160} defaultValue={user.user_metadata?.venue_name ?? ""} className="mt-2 w-full rounded-xl border p-3" /></label><label className="block text-sm font-bold">Booking page URL<input name="slug" required minLength={3} maxLength={40} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={user.user_metadata?.venue_slug ?? ""} className="mt-2 w-full rounded-xl border p-3" /></label><button className="w-full rounded-xl bg-[#235c43] p-3 font-bold text-white">Create venue</button></form></section></main>;
}
