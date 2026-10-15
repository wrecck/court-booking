"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");
  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/admin";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error)
    redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
  if (safeNext === "/admin") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!membership) redirect("/register/complete");
    }
  }
  redirect(safeNext);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email))
    redirect("/forgot-password?error=Enter%20a%20valid%20email%20address.");
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin ?? "https://courtbooking.codelooma.com"}/auth/callback?next=/reset-password`,
  });
  if (error)
    redirect(
      `/forgot-password?error=${encodeURIComponent("Unable to send the reset email right now. Please try again later.")}`,
    );
  redirect(
    "/forgot-password?success=If%20an%20account%20exists%20for%20that%20email%2C%20a%20password-reset%20link%20has%20been%20sent.",
  );
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8 || password.length > 128)
    redirect(
      "/reset-password?error=Use%20a%20password%20between%208%20and%20128%20characters.",
    );
  if (password !== confirmPassword)
    redirect("/reset-password?error=The%20passwords%20do%20not%20match.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      "/forgot-password?error=That%20reset%20link%20is%20invalid%20or%20has%20expired.",
    );
  const { error } = await supabase.auth.updateUser({ password });
  if (error)
    redirect(
      `/reset-password?error=${encodeURIComponent("Unable to update the password. Please request a new link.")}`,
    );
  await supabase.auth.signOut();
  redirect("/login?success=Password%20updated.%20You%20can%20sign%20in%20now.");
}
