import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CalendarCheck2,
  Check,
  Clock3,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { LegalFooter } from "@/components/legal-footer";

const features = [
  {
    icon: CalendarCheck2,
    title: "One reliable calendar",
    text: "Atomic court holds prevent double bookings—even when two players click at the same moment.",
  },
  {
    icon: CreditCard,
    title: "Payments your way",
    text: "Automatic GCash checkout, manual GCash, and bank transfers live in one clean payment flow.",
  },
  {
    icon: LayoutDashboard,
    title: "A calmer front desk",
    text: "Review proofs, approve payments, move bookings, and see every court from one dashboard.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[780px] bg-[#19462f] text-white">
        <SiteHeader />
        <div className="absolute inset-0 opacity-20 surface-grid" />
        <div className="absolute -right-40 top-20 size-[560px] rounded-full border border-white/10" />
        <div className="absolute -right-16 top-44 size-[330px] rounded-full border border-[#cbe86b]/25" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-40 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:pt-44">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#dcecac]">
              <span className="size-2 rounded-full bg-[#cbe86b]" /> Built for
              independent racquet venues
            </div>
            <h1 className="display max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              Court booking without the{" "}
              <span className="text-[#cbe86b]">back-and-forth.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/68">
              Give players a faster way to book and pay. Give your team fewer
              messages, fewer spreadsheets, and no double bookings.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/book/baseline"
                prefetch={false}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[#cbe86b] px-6 py-3.5 font-bold text-[#173020] transition hover:-translate-y-0.5 hover:bg-[#d8f37c]"
              >
                Try the booking flow <ArrowRight size={18} />
              </Link>
              <Link
                href="/register"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 font-bold text-white transition hover:bg-white/10"
              >
                Create your venue
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/62">
              {[
                "15-minute setup path",
                "Manual & automatic payments",
                "Mobile-first",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check size={15} className="text-[#cbe86b]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -left-8 top-16 hidden rounded-2xl bg-[#f08b6c] p-4 text-[#3f2118] shadow-2xl sm:block">
              <Clock3 size={20} />
              <p className="mt-5 text-xs font-bold uppercase tracking-wider">
                Slot held
              </p>
              <p className="display text-2xl font-extrabold">14:42</p>
            </div>
            <div className="rotate-[2deg] rounded-[32px] border border-white/15 bg-[#f8faf5] p-3 shadow-[0_35px_90px_rgba(0,0,0,.3)]">
              <div className="overflow-hidden rounded-[24px] bg-white text-[#17231b]">
                <div className="flex items-center justify-between border-b border-[#e7ebe5] px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#788279]">
                      Your booking
                    </p>
                    <p className="display mt-1 text-lg font-extrabold">
                      Baseline Racquet Club
                    </p>
                  </div>
                  <span className="rounded-full bg-[#e5f0e7] px-3 py-1.5 text-xs font-bold text-[#235c43]">
                    Makati
                  </span>
                </div>
                <div className="p-5">
                  <div className="rounded-2xl bg-[#f3f6f1] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Centre Court</p>
                        <p className="mt-1 text-xs text-[#6d786f]">
                          Today · 6:00–7:00 PM
                        </p>
                      </div>
                      <p className="display text-xl font-extrabold">₱600</p>
                    </div>
                  </div>
                  <p className="mb-3 mt-5 text-xs font-bold uppercase tracking-[.14em] text-[#7c867e]">
                    Choose payment
                  </p>
                  <div className="space-y-2.5">
                    {[
                      [
                        "GCash checkout",
                        "Instant confirmation",
                        "bg-[#1777e5]",
                      ],
                      ["GCash transfer", "Upload your receipt", "bg-[#e8f0ff]"],
                      [
                        "BDO bank transfer",
                        "Upload your receipt",
                        "bg-[#fff1df]",
                      ],
                    ].map(([name, detail, color], index) => (
                      <div
                        key={name}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 ${index === 0 ? "border-[#235c43] bg-[#f1f8f2]" : "border-[#e5e9e3]"}`}
                      >
                        <span
                          className={`grid size-9 place-items-center rounded-lg ${color}`}
                        >
                          <Banknote
                            size={18}
                            className={
                              index === 0 ? "text-white" : "text-[#235c43]"
                            }
                          />
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-bold">
                            {name}
                          </span>
                          <span className="block text-xs text-[#7a847c]">
                            {detail}
                          </span>
                        </span>
                        <span
                          className={`size-4 rounded-full border-4 ${index === 0 ? "border-[#235c43]" : "border-[#c9d0ca]"}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl bg-[#235c43] py-3.5 text-center text-sm font-bold text-white">
                    Continue securely
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-7 -right-5 hidden rounded-2xl bg-white p-4 text-[#173020] shadow-2xl sm:flex sm:items-center sm:gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#e5f0e7]">
                <ShieldCheck size={20} />
              </span>
              <div>
                <p className="text-sm font-bold">No double booking</p>
                <p className="text-xs text-[#788279]">
                  Database-enforced holds
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="product"
        className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#235c43]">
            One focused system
          </p>
          <h2 className="display mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
            From available slot to paid booking.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#69746c]">
            Designed around what actually happens at small clubs—not an
            enterprise feature checklist.
          </p>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }, index) => (
            <article
              key={title}
              className="rounded-[28px] border border-[#dfe5dc] bg-white p-7 shadow-[0_18px_50px_rgba(33,55,41,.06)]"
            >
              <div
                className={`grid size-12 place-items-center rounded-2xl ${index === 1 ? "bg-[#fff0eb] text-[#b9563b]" : index === 2 ? "bg-[#fff7df] text-[#8f6b16]" : "bg-[#e5f0e7] text-[#235c43]"}`}
              >
                <Icon size={23} />
              </div>
              <h3 className="display mt-7 text-xl font-extrabold">{title}</h3>
              <p className="mt-3 leading-7 text-[#6c776e]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="payments" className="bg-[#e7eee4] py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#235c43]">
              Payment flexibility
            </p>
            <h2 className="display mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              Automatic when possible. Human when practical.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#637067]">
              Every payment path starts the same safe hold. Venues choose what
              appears: integrated GCash checkout, manual wallets, or any number
              of bank accounts.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "One countdown across every payment option",
                "Proof upload with an admin review queue",
                "Webhook confirmation with idempotent processing",
                "Venue-specific recipient details and instructions",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 font-semibold"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-[#235c43] text-white">
                    <Check size={14} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[32px] bg-[#173f2c] p-6 text-white shadow-[var(--shadow)] sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">
                  Payment review
                </p>
                <p className="display mt-1 text-2xl font-extrabold">
                  2 need attention
                </p>
              </div>
              <span className="rounded-full bg-[#cbe86b] px-3 py-1.5 text-xs font-bold text-[#173020]">
                Live queue
              </span>
            </div>
            <div className="mt-7 space-y-3">
              {[
                ["Anton Reyes", "GCash transfer", "₱500"],
                ["Jamie Tan", "BPI transfer", "₱750"],
              ].map(([name, method, amount]) => (
                <div
                  key={name}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/7 p-4"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-white/10 font-bold">
                    {name.charAt(0)}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold">{name}</p>
                    <p className="text-sm text-white/55">
                      {method} · proof uploaded
                    </p>
                  </div>
                  <p className="font-bold">{amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="launch" className="px-5 py-24 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-[36px] bg-[#f08b6c] px-8 py-12 text-[#3a2118] sm:px-12 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em]">
              MVP foundation
            </p>
            <h2 className="display mt-3 max-w-2xl text-3xl font-extrabold sm:text-4xl">
              Ready to turn a real venue into the first design partner.
            </h2>
          </div>
          <Link
            href="/demo/admin"
            className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full bg-[#2f211c] px-6 py-3.5 font-bold text-white"
          >
            Explore admin demo <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <div className="bg-[#173f2c] px-5 py-7">
        <LegalFooter inverted />
      </div>
    </main>
  );
}
