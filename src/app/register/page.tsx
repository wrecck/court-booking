import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SubmitButton } from "@/components/submit-button";
import { LegalFooter } from "@/components/legal-footer";
import { register } from "./actions";

export const metadata = {
  title: "Create your venue",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[#173f2c] px-5 py-12">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-7 shadow-2xl sm:p-9">
        <BrandLogo />
        <h1 className="display mt-8 text-3xl font-extrabold">
          Create your venue
        </h1>
        <p className="mt-2 text-sm text-[#707b73]">
          Set up your own booking page and venue dashboard.
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
            {success}{" "}
            <Link className="underline" href="/login?next=/register/complete">
              Sign in
            </Link>
          </p>
        )}
        <form action={register} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            Venue name
            <input
              name="name"
              required
              minLength={2}
              maxLength={160}
              placeholder="Your Tennis Club"
              className="focus-ring mt-2 w-full rounded-xl border border-[#dce2dc] px-4 py-3"
            />
          </label>
          <label className="block text-sm font-bold">
            Booking page URL
            <input
              name="slug"
              required
              minLength={3}
              maxLength={40}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="your-tennis-club"
              className="focus-ring mt-2 w-full rounded-xl border border-[#dce2dc] px-4 py-3"
            />
            <span className="mt-1 block font-normal text-[#778279]">
              /book/your-tennis-club
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-6 text-[#59655d]">
            <input
              required
              name="terms"
              type="checkbox"
              className="mt-1 size-4 shrink-0"
            />
            <span>
              I agree to the{" "}
              <Link
                className="font-bold text-[#235c43] underline"
                href="/terms"
              >
                Terms of Service
              </Link>{" "}
              and acknowledge the{" "}
              <Link
                className="font-bold text-[#235c43] underline"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <label className="block text-sm font-bold">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="focus-ring mt-2 w-full rounded-xl border border-[#dce2dc] px-4 py-3"
            />
          </label>
          <label className="block text-sm font-bold">
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="focus-ring mt-2 w-full rounded-xl border border-[#dce2dc] px-4 py-3"
            />
          </label>
          <SubmitButton
            pendingText="Creating account…"
            className="w-full rounded-xl bg-[#235c43] px-4 py-3.5 font-bold text-white disabled:opacity-60"
          >
            Create account
          </SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm">
          Already registered?{" "}
          <Link className="font-bold text-[#235c43]" href="/login">
            Sign in
          </Link>
        </p>
        <div className="mt-6 border-t border-[#e4e8e3] pt-5">
          <LegalFooter />
        </div>
      </div>
    </main>
  );
}
