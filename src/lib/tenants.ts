import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export async function requireTenant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: operatorRecord } = await supabase
    .from("platform_operators")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (operatorRecord) {
    const { data: organizations, error } = await supabase
      .from("organizations")
      .select("id,name,slug,is_active")
      .order("created_at", { ascending: true });
    if (error) throw new Error("Unable to load platform venues.");
    if (!organizations?.length) redirect("/platform");
    const selectedId = (await cookies()).get("courtly_admin_tenant")?.value;
    const organization =
      organizations.find((tenant) => tenant.id === selectedId) ??
      organizations[0];
    return {
      supabase,
      user,
      organization: organization as Tenant,
      role: "platform_operator",
      operator: true,
      tenants: organizations as Tenant[],
    };
  }

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id,role,organizations(id,name,slug,is_active)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Unable to load your venues.");
  const membership = memberships?.[0];
  if (!membership) redirect("/register/complete");
  const organization = membership.organizations as unknown as Tenant;
  const tenants = memberships
    .map((item) => item.organizations as unknown as Tenant)
    .filter(Boolean);
  return {
    supabase,
    user,
    organization,
    role: membership.role as string,
    operator: false,
    tenants,
  };
}

export async function requireOperator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/platform");
  const { data, error } = await supabase
    .from("platform_operators")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) redirect("/admin");
  return { supabase, user };
}
