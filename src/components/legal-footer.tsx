import Link from "next/link";

export function LegalFooter({ inverted = false }: { inverted?: boolean }) {
  return (
    <footer
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs ${inverted ? "text-white/60" : "text-[#718076]"}`}
    >
      <span>© {new Date().getFullYear()} Courtly</span>
      <Link
        className="underline hover:text-current"
        href="/privacy"
        target="_blank"
        rel="noreferrer"
      >
        Privacy Policy
      </Link>
      <Link
        className="underline hover:text-current"
        href="/terms"
        target="_blank"
        rel="noreferrer"
      >
        Terms of Service
      </Link>
    </footer>
  );
}
