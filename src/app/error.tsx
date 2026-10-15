"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f5f1] px-5 py-12 text-center">
      <div className="max-w-lg rounded-[28px] border border-[#dfe5dc] bg-white p-8 shadow-xl sm:p-12">
        <p className="display text-xl font-extrabold text-[#235c43]">Courtly</p>
        <p className="mt-8 text-xs font-extrabold uppercase tracking-widest text-[#a44b34]">
          Something went wrong
        </p>
        <h1 className="display mt-3 text-3xl font-extrabold">
          We couldn&apos;t complete that play.
        </h1>
        <p className="mt-3 leading-7 text-[#718076]">
          Please try again. If the problem continues, return to Courtly and
          restart the booking.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer rounded-xl bg-[#235c43] px-5 py-3 font-bold text-white"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-[#235c43] px-5 py-3 font-bold text-[#235c43]"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
