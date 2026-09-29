import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export const requireTenant = cache(async function requireTenant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const [
    { data: operatorRecord, error: operatorError },
    { data: memberships, error: membershipError },
    { data: organizations, error: organizationError },
  ] = await Promise.all([
    supabase
      .from("platform_operators")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("organization_members")
      .select("organization_id,role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("organizations")
      .select("id,name,slug,is_active")
      .order("created_at", { ascending: true }),
  ]);
  if (operatorError || membershipError || organizationError)
    throw new Error("Unable to load your venues.");

  if (operatorRecord) {
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

  const membership = memberships?.[0];
  if (!membership) redirect("/register/complete");
  const organization = organizations?.find(
    (tenant) => tenant.id === membership.organization_id,
  );
  if (!organization) throw new Error("Unable to load your venue.");
  const tenants = memberships
    .map((item) =>
      organizations?.find((tenant) => tenant.id === item.organization_id),
    )
    .filter((tenant): tenant is Tenant => Boolean(tenant));
  return {
    supabase,
    user,
    organization,
    role: membership.role as string,
    operator: false,
    tenants,
  };
});

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
