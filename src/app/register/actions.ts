"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const registration = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(40),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export async function register(formData: FormData) {
  const parsed = registration.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/register?error=Check%20your%20venue%20details%20and%20password.");
  const { name, slug, email, password } = parsed.data;
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: { venue_name: name, venue_slug: slug },
      ...(origin ? { emailRedirectTo: `${origin}/auth/callback?next=/register/complete` } : {}),
    },
  });
  if (error || !data.user) redirect(`/register?error=${encodeURIComponent(error?.message ?? "Unable to create account.")}`);
  if (!data.session) redirect("/register?success=Check%20your%20email%20to%20confirm%20your%20account.%20Then%20sign%20in%20to%20finish%20setup.");
  const { error: provisionError } = await supabase.rpc("register_tenant", { p_name: name, p_slug: slug });
  if (provisionError) redirect(`/register/complete?error=${encodeURIComponent(provisionError.message.includes("slug_taken") ? "That URL is already in use." : "Unable to create venue. Please try another URL.")}`);
  redirect("/admin");
}

export async function completeRegistration(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (name.length < 2 || name.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 40) {
    redirect("/register/complete?error=Enter%20a%20valid%20name%20and%20URL.");
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/register/complete");
  const { data: member } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (member) redirect("/admin");
  const { error } = await supabase.rpc("register_tenant", { p_name: name, p_slug: slug });
  if (error) redirect(`/register/complete?error=${encodeURIComponent(error.message.includes("slug_taken") ? "That URL is already in use." : "Unable to create venue. Please try again.")}`);
  redirect("/admin");
}
