"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  CreditCard,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/login/actions";
import { switchTenant } from "@/app/admin/actions";
import { FormPendingIndicator, SubmitButton } from "@/components/submit-button";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  { href: "/admin/payments", label: "Payment review", icon: CreditCard },
  { href: "/admin/settings/courts", label: "Courts", icon: CalendarRange },
  { href: "/admin/settings/payments", label: "Settings", icon: Settings },
];

export function AdminShell({
  children,
  venueId,
  venueName,
  venueSlug,
  operator,
  tenants,
}: {
  children: React.ReactNode;
  venueId: string;
  venueName: string;
  venueSlug: string;
  operator: boolean;
  tenants: Array<{ id: string; name: string; slug: string }>;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);
  const [navigationPending, startNavigation] = useTransition();
  const navigatingTo = navigationPending ? navigationTarget : null;

  function beginNavigation(
    event: React.MouseEvent<HTMLAnchorElement>,
    target: string,
  ) {
    setOpen(false);
    if (
      target === path ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    setNavigationTarget(target);
    startNavigation(() => router.push(target));
  }
  return (
    <div className="min-h-screen bg-[#f3f5f1]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[270px] bg-[#173f2c] p-5 text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <BrandLogo inverted />
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X />
          </button>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/6 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/40">
            Current venue
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#cbe86b] font-bold text-[#173020]">
              {venueName.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              {operator && tenants.length > 1 ? (
                <form action={switchTenant}>
                  <select
                    aria-label="Switch venue"
                    name="tenantId"
                    defaultValue={venueId}
                    onChange={(event) =>
                      event.currentTarget.form?.requestSubmit()
                    }
                    className="w-full cursor-pointer rounded-lg border border-white/15 bg-[#173f2c] px-2 py-1.5 text-sm font-bold text-white"
                  >
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                  <FormPendingIndicator className="text-white/60" />
                </form>
              ) : (
                <span className="block truncate text-sm font-bold">
                  {venueName}
                </span>
              )}
              <Link
                href={`/tenant/${venueSlug}`}
                onClick={(event) =>
                  beginNavigation(event, `/tenant/${venueSlug}`)
                }
                className="mt-1 block text-xs text-white/55 hover:text-white"
              >
                <span className="inline-flex items-center gap-1.5">
                  View booking page
                  {navigatingTo === `/tenant/${venueSlug}` ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    "→"
                  )}
                </span>
              </Link>
            </span>
          </div>
        </div>
        <nav className="mt-7 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin" ? path === href : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={(event) => beginNavigation(event, href)}
                aria-busy={navigatingTo === href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition",
                  active
                    ? "bg-white text-[#173f2c]"
                    : "text-white/62 hover:bg-white/7 hover:text-white",
                )}
              >
                <Icon size={19} />
                <span className="flex-1">{label}</span>
                {navigatingTo === href && (
                  <LoaderCircle
                    aria-label={`Opening ${label}`}
                    className="size-4 animate-spin"
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-[#23543d] p-4">
          {operator && (
            <Link
              href="/platform"
              onClick={(event) => beginNavigation(event, "/platform")}
              className="block text-sm font-bold text-white"
            >
              <span className="inline-flex items-center gap-2">
                Platform backend
                {navigatingTo === "/platform" && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
              </span>
            </Link>
          )}
          <form action={signOut}>
            <SubmitButton
              pendingText="Signing out…"
              className="mt-2 text-sm font-bold text-white/70 disabled:opacity-60"
            >
              Sign out
            </SubmitButton>
          </form>
        </div>
      </aside>
      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#dfe4dc] bg-white/90 px-5 backdrop-blur sm:px-8">
          <button onClick={() => setOpen(true)} className="lg:hidden">
            <Menu />
          </button>
          <div className="hidden lg:block">
            <p className="text-xs font-bold text-[#859087]">Venue dashboard</p>
            <p className="font-bold">{venueName}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href={`/tenant/${venueSlug}`}
              onClick={(event) =>
                beginNavigation(event, `/tenant/${venueSlug}`)
              }
              className="text-sm font-bold text-[#235c43]"
            >
              <span className="inline-flex items-center gap-2">
                Booking page
                {navigatingTo === `/tenant/${venueSlug}` && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
              </span>
            </Link>
            <span className="grid size-10 place-items-center rounded-full bg-[#d7e5d7] text-sm font-extrabold text-[#235c43]">
              {venueName.charAt(0)}
            </span>
          </div>
        </header>
        <main className="p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
