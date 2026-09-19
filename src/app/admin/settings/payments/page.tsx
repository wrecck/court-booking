import { PaymentSettings } from "@/components/payment-settings";

export default function PaymentSettingsPage() {
  return <div className="mx-auto max-w-7xl"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#235c43]">Venue settings</p><h1 className="display mt-2 text-3xl font-extrabold">Payments and booking holds</h1><p className="mt-2 max-w-2xl text-[#6f7a72]">Control which options customers see, where manual transfers are sent, and how long courts remain reserved.</p><div className="mt-8"><PaymentSettings /></div></div>;
}
