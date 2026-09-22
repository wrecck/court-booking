import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireTenant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: memberships, error } = await supabase.from("organization_members")
    .select("organization_id,role,organizations(id,name,slug,is_active)")
    .eq("user_id", user.id).order("created_at", { ascending: true });
  if (error) throw new Error("Unable to load your venues.");
  const membership = memberships?.[0];
  if (!membership) redirect("/register/complete");
  const organization = membership.organizations as unknown as { id: string; name: string; slug: string; is_active: boolean };
  return { supabase, user, organization, role: membership.role as string };
}

export async function requireOperator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/platform");
  const { data, error } = await supabase.from("platform_operators").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error || !data) redirect("/admin");
  return { supabase, user };
}
