"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireOperator } from "@/lib/tenants";

export async function switchTenant(formData: FormData) {
  const { supabase } = await requireOperator();
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!/^[a-f0-9-]{36}$/.test(tenantId)) throw new Error("Invalid venue.");

  const { data: tenant, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", tenantId)
    .maybeSingle();
  if (error || !tenant) throw new Error("Venue not found.");

  (await cookies()).set("courtly_admin_tenant", tenant.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}
