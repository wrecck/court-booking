import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing venue accounts, court bookings, and payments made through Courtly.",
  alternates: { canonical: "/terms" },
};

const sections = [
  [
    "Using Courtly",
    "You must provide accurate information and use the service lawfully. Venue operators are responsible for their venue information, court schedules, prices, payment instructions, staff access, and fulfillment of bookings.",
  ],
  [
    "Accounts",
    "Venue operators are responsible for safeguarding their login credentials and for activity performed through their accounts. Notify us promptly if you believe an account has been compromised.",
  ],
  [
    "Booking holds and confirmation",
    "Selecting a slot and starting payment may place the court on a temporary hold. A hold is not a confirmed booking. A booking becomes confirmed only when the applicable automatic payment succeeds or the venue approves the submitted payment proof.",
  ],
  [
    "Payments and refunds",
    "Venues choose the payment methods offered to players. Manual transfers are made directly to the venue and are reviewed by the venue. The venue is responsible for its refund, cancellation, tax, and consumer-service obligations unless a checkout screen expressly states otherwise.",
  ],
  [
    "Uploaded content",
    "You may upload payment proofs and other information needed for a booking. You confirm that you have the right to provide that content and that it is accurate, lawful, and relevant to the transaction.",
  ],
  [
    "Availability",
    "We work to keep Courtly reliable, but the service may occasionally be unavailable for maintenance, security, provider outages, or circumstances outside our control. We may change features as the platform evolves.",
  ],
  [
    "Prohibited activity",
    "You may not misuse the service, attempt unauthorized access, interfere with another tenant, submit fraudulent payment information, scrape protected information, or use Courtly to violate applicable law.",
  ],
  [
    "Suspension and termination",
    "We may restrict or terminate access when necessary to protect users, venues, the platform, or comply with law. Venue operators may stop using the service, subject to any agreed billing terms and lawful record-retention requirements.",
  ],
  [
    "Liability",
    "To the extent permitted by law, Courtly is not responsible for disputes between venues and players, venue closures, injuries, the quality of venue services, or losses caused by inaccurate venue information or third-party payment services. Nothing in these terms excludes rights that cannot legally be excluded.",
  ],
  [
    "Governing law and changes",
    "These terms are governed by the laws of the Philippines. We may revise them as the service changes, and continued use after the effective date means you accept the updated terms.",
  ],
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f1] px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-[28px] border border-[#dfe5dc] bg-white p-7 shadow-sm sm:p-12">
        <Link href="/" aria-label="Courtly home">
          <BrandLogo />
        </Link>
        <p className="mt-10 text-xs font-extrabold uppercase tracking-widest text-[#235c43]">
          Legal
        </p>
        <h1 className="display mt-2 text-4xl font-extrabold">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-[#718076]">
          Effective October 15, 2026
        </p>
        <p className="mt-7 leading-7 text-[#4f5c53]">
          These terms govern your use of Courtly. By creating a venue account,
          making a booking, or otherwise using the service, you agree to these
          terms.
        </p>
        <div className="mt-9 space-y-8">
          {sections.map(([title, text]) => (
            <section key={title}>
              <h2 className="display text-xl font-extrabold">{title}</h2>
              <p className="mt-2 leading-7 text-[#4f5c53]">{text}</p>
            </section>
          ))}
          <section>
            <h2 className="display text-xl font-extrabold">Contact</h2>
            <p className="mt-2 leading-7 text-[#4f5c53]">
              Questions about these terms may be sent to{" "}
              <a
                className="font-bold text-[#235c43] underline"
                href="mailto:legal@codelooma.com"
              >
                legal@codelooma.com
              </a>
              .
            </p>
          </section>
        </div>
        <div className="mt-12 border-t border-[#e4e8e3] pt-6">
          <LegalFooter />
        </div>
      </article>
    </main>
  );
}
