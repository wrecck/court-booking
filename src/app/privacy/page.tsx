import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Courtly collects, uses, stores, and protects personal information.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  [
    "Information we collect",
    "We collect account details supplied by venue operators, including names, email addresses, phone numbers, venue details, and authentication information. When a player makes a booking, we collect the booking details, contact information, selected court and schedule, payment references, and any payment proof the player uploads.",
  ],
  [
    "How we use information",
    "We use information to operate the booking service, hold and confirm courts, process or review payments, prevent double bookings and fraud, provide support, maintain security, and improve the platform. We do not sell personal information.",
  ],
  [
    "Venues and service providers",
    "The venue receiving a booking can access the information needed to administer that reservation and payment. We also use infrastructure and service providers such as hosting, database, storage, email, and payment providers. They receive information only as needed to provide their services.",
  ],
  [
    "Payment information",
    "Courtly may store transaction references and uploaded proof of payment. Card, wallet, or bank credentials entered directly into an integrated payment provider are handled by that provider and are not stored by Courtly unless explicitly stated during checkout.",
  ],
  [
    "Retention and security",
    "We retain information for as long as reasonably necessary to provide the service, meet legal and accounting requirements, resolve disputes, and prevent abuse. We use access controls, encrypted connections, tenant-level database policies, and restricted proof-of-payment storage, but no online system can guarantee absolute security.",
  ],
  [
    "Your choices and rights",
    "You may request access, correction, or deletion of your personal information, subject to legal and operational retention requirements. Players may also contact the venue that received their booking. Venue operators can update account and payment information through their dashboard.",
  ],
  [
    "Children and updates",
    "Courtly is not intended for children who cannot legally consent to providing personal information. We may update this policy as the service changes and will publish the revised effective date on this page.",
  ],
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f1] px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-[28px] border border-[#dfe5dc] bg-white p-7 shadow-sm sm:p-12">
        <Link href="/" aria-label="Courtly home">
          <BrandLogo />
        </Link>
        <p className="mt-10 text-xs font-extrabold uppercase tracking-widest text-[#235c43]">
          Legal
        </p>
        <h1 className="display mt-2 text-4xl font-extrabold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[#718076]">
          Effective October 15, 2026
        </p>
        <p className="mt-7 leading-7 text-[#4f5c53]">
          Courtly, operated through Codelooma, provides booking and
          payment-management tools to independent venues. This policy explains
          how personal information is handled when you use the platform.
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
              For privacy requests or questions, email{" "}
              <a
                className="font-bold text-[#235c43] underline"
                href="mailto:privacy@codelooma.com"
              >
                privacy@codelooma.com
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
