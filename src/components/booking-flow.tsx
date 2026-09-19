"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, Building2, CalendarDays, Check, Clock3, FileCheck2, MapPin, ShieldCheck, Smartphone, Upload } from "lucide-react";
import Link from "next/link";
import { courts, paymentMethods, venue } from "@/lib/demo-data";
import { cn, formatCurrency, formatTime } from "@/lib/utils";

const dates = [
  { day: "TODAY", date: "19", label: "Sep 19" },
  { day: "SUN", date: "20", label: "Sep 20" },
  { day: "MON", date: "21", label: "Sep 21" },
  { day: "TUE", date: "22", label: "Sep 22" },
  { day: "WED", date: "23", label: "Sep 23" },
];

const slots = [420, 480, 540, 600, 660, 720, 780, 840, 900, 960, 1020, 1080, 1140, 1200];
const unavailable = new Set([480, 600, 780, 900, 1020]);

function HoldTimer({ seconds = 900 }: { seconds?: number }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return <span className="font-bold tabular-nums">{String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>;
}

export function BookingFlow() {
  const [step, setStep] = useState<"slot" | "details" | "payment" | "submitted">("slot");
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState(courts[0].id);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(1080);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].id);
  const [fileName, setFileName] = useState("");
  const chosenCourt = courts.find((court) => court.id === selectedCourt) ?? courts[0];
  const chosenPayment = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[0];
  const price = chosenCourt.indoor ? 75000 : selectedSlot && selectedSlot >= 1020 ? 60000 : 50000;
  const holding = step === "payment" || step === "submitted";
  const progress = { slot: 1, details: 2, payment: 3, submitted: 4 }[step];

  return (
    <div className="min-h-screen bg-[#f2f5ef]">
      <header className="border-b border-[#dfe5dc] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#235c43] font-bold text-white">B</span><div><p className="display font-extrabold">{venue.name}</p><p className="flex items-center gap-1 text-xs text-[#778079]"><MapPin size={12} />{venue.location}</p></div></div>
          <Link href="/" className="text-sm font-bold text-[#235c43]">Exit booking</Link>
        </div>
      </header>

      {holding && <div className="bg-[#fff0eb] text-[#643222]"><div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-5 py-3 text-sm"><Clock3 size={17} /><span>Your court is held for</span><HoldTimer /><span className="hidden text-[#8d5a48] sm:inline">while you complete payment</span></div></div>}

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex items-center justify-between gap-2">
          {["Court", "Details", "Payment", "Done"].map((label, index) => <div key={label} className="flex flex-1 items-center gap-2"><span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold", progress > index ? "bg-[#235c43] text-white" : "bg-[#dfe5dc] text-[#6f7971]")}>{progress > index + 1 ? <Check size={14} /> : index + 1}</span><span className={cn("hidden text-xs font-bold sm:inline", progress > index ? "text-[#203328]" : "text-[#8a938c]")}>{label}</span>{index < 3 && <span className="h-px flex-1 bg-[#d8ded7]" />}</div>)}
        </div>

        {step === "slot" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="rounded-[28px] border border-[#dfe5dc] bg-white p-5 shadow-[0_15px_45px_rgba(30,55,38,.05)] sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#235c43]">Make a booking</p><h1 className="display mt-2 text-3xl font-extrabold">Choose your court</h1></div><CalendarDays className="text-[#235c43]" /></div>
              <div className="hide-scrollbar mt-7 flex gap-2 overflow-x-auto pb-2">{dates.map((item, index) => <button key={item.label} onClick={() => setSelectedDate(index)} className={cn("focus-ring min-w-[78px] rounded-2xl border px-3 py-3 text-center transition", selectedDate === index ? "border-[#235c43] bg-[#235c43] text-white" : "border-[#dfe5dc] hover:border-[#8fad99]")}><span className="block text-[10px] font-extrabold tracking-wider opacity-70">{item.day}</span><span className="display mt-1 block text-xl font-extrabold">{item.date}</span></button>)}</div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">{courts.map((court) => <button key={court.id} onClick={() => setSelectedCourt(court.id)} className={cn("focus-ring flex items-center justify-between rounded-2xl border p-4 text-left transition", selectedCourt === court.id ? "border-[#235c43] bg-[#eff6ef]" : "border-[#e0e5df] hover:border-[#a7b9aa]")}><div><span className="block font-bold">{court.name}</span><span className="mt-1 block text-xs text-[#748077]">{court.surface} · {court.indoor ? "Covered" : "Outdoor"}</span></div><span className={cn("size-4 rounded-full border-4", selectedCourt === court.id ? "border-[#235c43]" : "border-[#cbd2cc]")} /></button>)}</div>
              <div className="mt-8"><div className="mb-4 flex items-center justify-between"><p className="font-bold">Available times</p><p className="text-xs text-[#778079]">60-minute booking</p></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">{slots.map((slot) => { const disabled = unavailable.has(slot); return <button key={slot} disabled={disabled} onClick={() => setSelectedSlot(slot)} className={cn("focus-ring rounded-xl border px-2 py-3 text-sm font-bold transition", disabled && "cursor-not-allowed border-transparent bg-[#f1f3f0] text-[#b2b9b3] line-through", !disabled && selectedSlot === slot && "border-[#235c43] bg-[#235c43] text-white", !disabled && selectedSlot !== slot && "border-[#dfe5dc] hover:border-[#7fa08a]")}>{formatTime(slot)}</button>; })}</div></div>
            </section>
            <BookingSummary court={chosenCourt.name} slot={selectedSlot} date={dates[selectedDate].label} price={price} onContinue={() => selectedSlot && setStep("details")} buttonText="Continue" />
          </div>
        )}

        {step === "details" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="rounded-[28px] border border-[#dfe5dc] bg-white p-5 sm:p-7"><button onClick={() => setStep("slot")} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#235c43]"><ArrowLeft size={16} />Change court</button><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#235c43]">Player information</p><h1 className="display mt-2 text-3xl font-extrabold">Who is playing?</h1><div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Full name" placeholder="Juan Dela Cruz" /><Field label="Mobile number" placeholder="0917 123 4567" /><Field label="Email address" placeholder="juan@example.com" type="email" /><Field label="Number of players" placeholder="2" type="number" /></div><label className="mt-5 block"><span className="mb-2 block text-sm font-bold">Notes <span className="font-normal text-[#8a938c]">(optional)</span></span><textarea rows={3} className="focus-ring w-full resize-none rounded-xl border border-[#dce2dc] bg-[#fafbf9] px-4 py-3 outline-none" placeholder="Equipment rental, guest names, or a note for the venue" /></label></section>
            <BookingSummary court={chosenCourt.name} slot={selectedSlot} date={dates[selectedDate].label} price={price} onContinue={() => setStep("payment")} buttonText="Hold court & pay" />
          </div>
        )}

        {step === "payment" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="rounded-[28px] border border-[#dfe5dc] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#235c43]">Payment</p><h1 className="display mt-2 text-3xl font-extrabold">Choose how to pay</h1></div><ShieldCheck className="text-[#235c43]" /></div><div className="mt-7 space-y-3">{paymentMethods.map((method) => <button key={method.id} onClick={() => { setPaymentMethod(method.id); setFileName(""); }} className={cn("focus-ring flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition", paymentMethod === method.id ? "border-[#235c43] bg-[#f0f7f0]" : "border-[#dfe5dc]")}><span className={cn("grid size-11 place-items-center rounded-xl", method.type === "gcash" ? "bg-[#e7f0ff] text-[#1769c8]" : "bg-[#fff4df] text-[#846019]")}>{method.mode === "automatic" ? <Smartphone size={21} /> : method.type === "bank" ? <Building2 size={21} /> : <Banknote size={21} />}</span><span className="flex-1"><span className="block font-bold">{method.name}</span><span className="mt-1 block text-sm text-[#748077]">{method.description}</span></span><span className={cn("size-5 rounded-full border-[5px]", paymentMethod === method.id ? "border-[#235c43]" : "border-[#cbd2cc]")} /></button>)}</div>
              {chosenPayment.mode === "manual" && <div className="mt-6 rounded-2xl border border-[#dfe5dc] bg-[#fafbf8] p-5"><div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 text-[#235c43]" size={20} /><div><p className="font-bold">Send the exact amount, then upload proof</p><p className="mt-1 text-sm leading-6 text-[#6f7971]">Use your booking reference in the transfer note when available. Your court stays held while the venue reviews it.</p></div></div><label className="focus-ring mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#96ac9a] bg-white px-4 py-6 text-sm font-bold text-[#235c43]"><Upload size={18} />{fileName || "Choose screenshot or PDF"}<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} /></label></div>}
            </section>
            <aside className="h-fit rounded-[24px] bg-[#173f2c] p-5 text-white"><p className="text-xs font-bold uppercase tracking-[.14em] text-white/50">Amount due</p><p className="display mt-2 text-4xl font-extrabold">{formatCurrency(price)}</p><div className="my-5 h-px bg-white/10" /><p className="text-sm text-white/65">{chosenCourt.name} · {dates[selectedDate].label}</p><p className="mt-1 font-bold">{selectedSlot !== null ? `${formatTime(selectedSlot)}–${formatTime(selectedSlot + 60)}` : ""}</p><button onClick={() => setStep("submitted")} disabled={chosenPayment.mode === "manual" && !fileName} className="focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#cbe86b] px-4 py-3.5 font-bold text-[#173020] transition enabled:hover:bg-[#d9f37d] disabled:cursor-not-allowed disabled:opacity-45">{chosenPayment.mode === "automatic" ? "Continue to GCash" : "Submit proof"}<ArrowRight size={17} /></button><p className="mt-3 text-center text-xs text-white/45">The slot remains blocked during this payment attempt.</p></aside>
          </div>
        )}

        {step === "submitted" && <section className="mx-auto max-w-2xl rounded-[32px] border border-[#dfe5dc] bg-white p-7 text-center shadow-[0_20px_60px_rgba(30,55,38,.08)] sm:p-12"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e5f0e7] text-[#235c43]"><Check size={30} strokeWidth={3} /></span><p className="mt-7 text-xs font-extrabold uppercase tracking-[.16em] text-[#235c43]">{chosenPayment.mode === "automatic" ? "Payment confirmed" : "Proof submitted"}</p><h1 className="display mt-3 text-3xl font-extrabold sm:text-4xl">{chosenPayment.mode === "automatic" ? "Your court is booked." : "Your court is reserved for review."}</h1><p className="mx-auto mt-4 max-w-lg leading-7 text-[#6d786f]">{chosenPayment.mode === "automatic" ? "A confirmation has been sent to your email and mobile number." : "The venue has been notified. You’ll receive confirmation as soon as the transfer is verified."}</p><div className="mx-auto mt-8 max-w-md rounded-2xl bg-[#f2f5ef] p-5 text-left"><div className="flex justify-between"><span className="text-sm text-[#738077]">Reference</span><span className="font-bold">BK-DEMO-2049</span></div><div className="mt-3 flex justify-between"><span className="text-sm text-[#738077]">Status</span><span className="rounded-full bg-[#fff0d1] px-2.5 py-1 text-xs font-bold text-[#75550d]">{chosenPayment.mode === "automatic" ? "Confirmed" : "Awaiting review"}</span></div></div><Link href="/" className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full bg-[#235c43] px-6 py-3 font-bold text-white">Back to club website <ArrowRight size={17} /></Link></section>}
      </main>
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return <label><span className="mb-2 block text-sm font-bold">{label}</span><input type={type} placeholder={placeholder} className="focus-ring w-full rounded-xl border border-[#dce2dc] bg-[#fafbf9] px-4 py-3 outline-none" /></label>;
}

function BookingSummary({ court, slot, date, price, onContinue, buttonText }: { court: string; slot: number | null; date: string; price: number; onContinue: () => void; buttonText: string }) {
  return <aside className="h-fit rounded-[24px] border border-[#dfe5dc] bg-white p-5 lg:sticky lg:top-5"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#788279]">Your booking</p><h2 className="display mt-2 text-xl font-extrabold">{court}</h2><div className="mt-5 space-y-3 text-sm"><div className="flex items-center gap-3"><CalendarDays size={17} className="text-[#235c43]" />{date}, 2026</div><div className="flex items-center gap-3"><Clock3 size={17} className="text-[#235c43]" />{slot !== null ? `${formatTime(slot)}–${formatTime(slot + 60)}` : "Choose a time"}</div></div><div className="my-5 h-px bg-[#e3e7e2]" /><div className="flex items-end justify-between"><span className="text-sm text-[#738077]">Total</span><span className="display text-2xl font-extrabold">{formatCurrency(price)}</span></div><button disabled={slot === null} onClick={onContinue} className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#235c43] px-4 py-3.5 font-bold text-white transition enabled:hover:bg-[#17442f] disabled:opacity-40">{buttonText}<ArrowRight size={17} /></button><p className="mt-3 text-center text-xs leading-5 text-[#849087]">The slot is held when you proceed to payment.</p></aside>;
}
