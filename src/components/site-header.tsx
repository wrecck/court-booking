import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <BrandLogo inverted />
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/75 md:flex">
          <a href="#product" className="transition hover:text-white">Product</a>
          <a href="#payments" className="transition hover:text-white">Payments</a>
          <a href="#launch" className="transition hover:text-white">For venues</a>
        </nav>
        <Link href="/book/baseline" className="focus-ring inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#17442f] shadow-sm transition hover:-translate-y-0.5">
          View live flow <ArrowUpRight size={16} />
        </Link>
      </div>
    </header>
  );
}
