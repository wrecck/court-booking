import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f5f1] px-5 py-12 text-center">
      <div className="max-w-lg rounded-[28px] border border-[#dfe5dc] bg-white p-8 shadow-xl sm:p-12">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <p className="mt-8 text-xs font-extrabold uppercase tracking-widest text-[#235c43]">
          404 · Page not found
        </p>
        <h1 className="display mt-3 text-3xl font-extrabold">
          This court is out of bounds.
        </h1>
        <p className="mt-3 leading-7 text-[#718076]">
          The venue or page may have moved, or the booking link may be
          incorrect.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-xl bg-[#235c43] px-5 py-3 font-bold text-white"
        >
          Return to Courtly
        </Link>
      </div>
    </main>
  );
}
