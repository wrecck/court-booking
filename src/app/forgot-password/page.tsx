import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";
import { SubmitButton } from "@/components/submit-button";
import { requestPasswordReset } from "@/app/login/actions";

export const metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#173f2c] px-5 py-12">
      <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl sm:p-9">
        <BrandLogo />
        <h1 className="display mt-8 text-3xl font-extrabold">
          Reset your password
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#707b73]">
          Enter your venue account email and we’ll send you a secure reset link.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-[#fff0eb] p-3 text-sm text-[#9c442e]"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-[#e5f0e7] p-3 text-sm text-[#235c43]"
          >
            {success}
          </p>
        )}
        <form action={requestPasswordReset} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            Email
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              className="focus-ring mt-2 w-full rounded-xl border border-[#dce2dc] bg-[#fafbf9] px-4 py-3 outline-none"
            />
          </label>
          <SubmitButton
            pendingText="Sending reset link…"
            className="w-full rounded-xl bg-[#235c43] px-4 py-3.5 font-bold text-white disabled:opacity-60"
          >
            Send reset link
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
