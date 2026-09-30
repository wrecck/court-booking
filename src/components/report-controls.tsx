"use client";

import { LoaderCircle, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

export function ReportFilters({
  initialFrom,
  initialTo,
  currentMonth,
  previousMonth,
}: {
  initialFrom: string;
  initialTo: string;
  currentMonth: { from: string; to: string };
  previousMonth: { from: string; to: string };
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [pending, startTransition] = useTransition();

  function openReport(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    startTransition(() => {
      router.push(
        `/admin/reports?from=${encodeURIComponent(nextFrom)}&to=${encodeURIComponent(nextTo)}`,
      );
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openReport(from, to);
  }

  return (
    <form
      onSubmit={submit}
      className="no-print mt-7 rounded-2xl border border-[#dde3dc] bg-white p-5"
    >
      <div className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm font-bold">
          From
          <input
            required
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-[#ccd4cc] bg-white px-3 py-2.5 font-normal"
          />
        </label>
        <label className="text-sm font-bold">
          To
          <input
            required
            type="date"
            value={to}
            min={from}
            onChange={(event) => setTo(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-[#ccd4cc] bg-white px-3 py-2.5 font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#235c43] px-5 font-bold text-white disabled:opacity-60"
        >
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {pending ? "Generating…" : "Generate report"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => openReport(currentMonth.from, currentMonth.to)}
          className="rounded-lg border border-[#ccd4cc] px-3 py-2 text-sm font-bold text-[#235c43]"
        >
          This month
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => openReport(previousMonth.from, previousMonth.to)}
          className="rounded-lg border border-[#ccd4cc] px-3 py-2 text-sm font-bold text-[#235c43]"
        >
          Previous month
        </button>
      </div>
    </form>
  );
}

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-xl border border-[#235c43] bg-white px-4 py-2.5 text-sm font-bold text-[#235c43]"
    >
      <Printer className="size-4" />
      Print report
    </button>
  );
}
