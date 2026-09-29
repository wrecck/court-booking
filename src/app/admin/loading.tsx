export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto max-w-7xl animate-pulse"
    >
      <div className="h-4 w-28 rounded bg-[#dfe6de]" />
      <div className="mt-4 h-10 w-72 max-w-full rounded bg-[#d8e0d8]" />
      <div className="mt-3 h-4 w-96 max-w-full rounded bg-[#e1e7e0]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-28 rounded-2xl border border-[#e0e5df] bg-white"
          />
        ))}
      </div>
      <div className="mt-7 h-72 rounded-2xl border border-[#e0e5df] bg-white" />
      <span className="sr-only">Loading page…</span>
    </div>
  );
}
