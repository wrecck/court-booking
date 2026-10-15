import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SubmitButton } from "@/components/submit-button";
import { signIn } from "./actions";
import { LegalFooter } from "@/components/legal-footer";

export const metadata = {
  title: "Venue sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#173f2c] px-5 py-12">
      <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl sm:p-9">
        <BrandLogo />
        <div className="mt-8">
          <span className="grid size-11 place-items-center rounded-xl bg-[#e5f0e7] text-[#235c43]">
            <LockKeyhole size={21} />
          </span>
          <h1 className="display mt-5 text-3xl font-extrabold">
            Venue sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#707b73]">
            Manage courts, review payments, and see today’s schedule.
          </p>
        </div>
        {params.error && (
          <p className="mt-5 rounded-xl bg-[#fff0eb] p-3 text-sm font-bold text-[#9c442e]">
            {params.error}
          </p>
        )}
        {params.success && (
          <p className="mt-5 rounded-xl bg-[#e5f0e7] p-3 text-sm font-bold text-[#235c43]">
            {params.success}
          </p>
        )}
        <form action={signIn} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={params.next ?? "/admin"} />
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Email</span>
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              className="focus-ring w-full rounded-xl border border-[#dce2dc] bg-[#fafbf9] px-4 py-3 outline-none"
            />
          </label>
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-bold text-[#235c43] underline"
            >
              Forgot password?
            </Link>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Password</span>
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
              className="focus-ring w-full rounded-xl border border-[#dce2dc] bg-[#fafbf9] px-4 py-3 outline-none"
            />
          </label>
          <SubmitButton
            pendingText="Signing in…"
            className="focus-ring w-full rounded-xl bg-[#235c43] px-4 py-3.5 font-bold text-white disabled:opacity-60"
          >
            Sign in
          </SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm">
          New venue?{" "}
          <Link href="/register" className="font-bold text-[#235c43]">
            Create an account
          </Link>
        </p>
        <Link
          href="/"
          className="mt-5 block text-center text-sm font-bold text-[#235c43]"
        >
          Return to Courtly
        </Link>
        <div className="mt-6 border-t border-[#e4e8e3] pt-5">
          <LegalFooter />
        </div>
      </div>
    </main>
  );
}
