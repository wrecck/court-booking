import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";
import { SubmitButton } from "@/components/submit-button";
import { updatePassword } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      "/forgot-password?error=Please%20request%20a%20new%20password-reset%20link.",
    );

  return (
    <main className="grid min-h-screen place-items-center bg-[#173f2c] px-5 py-12">
      <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl sm:p-9">
        <BrandLogo />
        <h1 className="display mt-8 text-3xl font-extrabold">
          Choose a new password
        </h1>
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-[#fff0eb] p-3 text-sm text-[#9c442e]"
          >
            {error}
          </p>
        )}
        <form action={updatePassword} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            New password
            <input
              required
              minLength={8}
              maxLength={128}
              name="password"
              type="password"
              autoComplete="new-password"
              className="focus-ring mt-2 w-full rounded-xl border border-[#dce2dc] px-4 py-3"
            />
          </label>
          <label className="block text-sm font-bold">
            Confirm new password
            <input
              required
              minLength={8}
              maxLength={128}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="focus-ring mt-2 w-full rounded-xl border border-[#dce2dc] px-4 py-3"
            />
          </label>
          <SubmitButton
            pendingText="Updating password…"
            className="w-full rounded-xl bg-[#235c43] px-4 py-3.5 font-bold text-white disabled:opacity-60"
          >
            Update password
          </SubmitButton>
        </form>
        <Link
          href="/login"
          className="mt-6 block text-center text-sm font-bold text-[#235c43]"
        >
          Return to sign in
        </Link>
        <div className="mt-6 border-t border-[#e4e8e3] pt-5">
          <LegalFooter />
        </div>
      </div>
    </main>
  );
}
