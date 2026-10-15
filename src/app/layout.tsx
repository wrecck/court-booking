import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: "Courtly — Court booking, without the back-and-forth",
    template: "%s | Courtly",
  },
  description:
    "A mobile-first court booking and payment platform for independent racquet-sport venues.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Courtly",
    title: "Courtly — Court booking, without the back-and-forth",
    description:
      "A mobile-first court booking and payment platform for independent racquet-sport venues.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Courtly — Court booking, without the back-and-forth",
    description:
      "A mobile-first court booking and payment platform for independent racquet-sport venues.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
