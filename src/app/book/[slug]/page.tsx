import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking-flow";

export const metadata: Metadata = { title: "Book a court" };

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  return <BookingFlow />;
}
