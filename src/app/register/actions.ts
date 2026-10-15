"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const registration = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(3)
    .max(40),
  email: z.email(),
  password: z.string().min(8).max(128),
  terms: z.literal("on"),
});

export async function register(formData: FormData) {
  const parsed = registration.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect(
      "/register?error=Check%20your%20venue%20details%20and%20password.",
    );
  const { name, slug, email, password } = parsed.data;
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { venue_name: name, venue_slug: slug },
      ...(origin
        ? { emailRedirectTo: `${origin}/auth/callback?next=/register/complete` }
        : {}),
    },
  });
  if (error || !data.user) {
    const message =
      error?.code === "over_email_send_rate_limit"
        ? "Too many confirmation emails were requested. Please wait a few minutes and try again."
        : (error?.message ?? "Unable to create account.");
    redirect(`/register?error=${encodeURIComponent(message)}`);
  }
  if (data.user.identities?.length === 0) {
    redirect(
      "/login?error=An%20account%20with%20that%20email%20already%20exists.",
    );
  }

  const admin = createAdminClient();
  const { error: provisionError } = await admin.rpc("provision_tenant", {
    p_user_id: data.user.id,
    p_name: name,
    p_slug: slug,
  });
  if (provisionError) {
    await admin.auth.admin.deleteUser(data.user.id);
    const message = provisionError.message.includes("slug_taken")
      ? "That booking page URL is already in use."
      : "Your account could not be completed. Please try again.";
    redirect(`/register?error=${encodeURIComponent(message)}`);
  }
  if (!data.session)
    redirect(
      "/register?success=Your%20venue%20is%20ready.%20Check%20your%20email%20to%20confirm%20your%20account%2C%20then%20sign%20in.",
    );
  redirect("/admin");
}

export async function completeRegistration(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (
    name.length < 2 ||
    name.length > 160 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    slug.length < 3 ||
    slug.length > 40
  ) {
    redirect("/register/complete?error=Enter%20a%20valid%20name%20and%20URL.");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/register/complete");
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (member) redirect("/admin");
  const { error } = await supabase.rpc("register_tenant", {
    p_name: name,
    p_slug: slug,
  });
  if (error)
    redirect(
      `/register/complete?error=${encodeURIComponent(error.message.includes("slug_taken") ? "That URL is already in use." : "Unable to create venue. Please try again.")}`,
    );
  redirect("/admin");
}
