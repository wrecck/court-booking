"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarRange, ChevronDown, CreditCard, LayoutDashboard, Menu, Settings, Users, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  { href: "/admin/payments", label: "Payment review", icon: CreditCard, badge: "2" },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings/payments", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f3f5f1]">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-[270px] bg-[#173f2c] p-5 text-white transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between"><BrandLogo inverted /><button onClick={() => setOpen(false)} className="lg:hidden"><X /></button></div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/6 p-3"><p className="text-[10px] font-extrabold uppercase tracking-wider text-white/40">Current venue</p><button className="mt-2 flex w-full items-center gap-3 text-left"><span className="grid size-9 place-items-center rounded-xl bg-[#cbe86b] font-bold text-[#173020]">B</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">Baseline Racquet Club</span><span className="block text-xs text-white/45">Makati City</span></span><ChevronDown size={15} /></button></div>
        <nav className="mt-7 space-y-1">{nav.map(({ href, label, icon: Icon, badge }) => { const active = href === "/admin" ? path === href : path.startsWith(href); return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition", active ? "bg-white text-[#173f2c]" : "text-white/62 hover:bg-white/7 hover:text-white")}><Icon size={19} /><span className="flex-1">{label}</span>{badge && <span className="rounded-full bg-[#f08b6c] px-2 py-0.5 text-[10px] text-[#442218]">{badge}</span>}</Link>; })}</nav>
        <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-[#23543d] p-4"><p className="text-sm font-bold">MVP workspace</p><p className="mt-1 text-xs leading-5 text-white/50">Payments and booking holds are configured for Philippine venues.</p></div>
      </aside>
      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#dfe4dc] bg-white/90 px-5 backdrop-blur sm:px-8"><button onClick={() => setOpen(true)} className="lg:hidden"><Menu /></button><div className="hidden lg:block"><p className="text-xs font-bold text-[#859087]">Friday, September 19</p><p className="font-bold">Good morning, Derick</p></div><div className="ml-auto flex items-center gap-3"><button className="relative grid size-10 place-items-center rounded-full border border-[#dde3dd] bg-white"><Bell size={18} /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#f08b6c]" /></button><span className="grid size-10 place-items-center rounded-full bg-[#d7e5d7] text-sm font-extrabold text-[#235c43]">DM</span></div></header>
        <main className="p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
