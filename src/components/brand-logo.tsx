import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({ inverted = false, compact = false }: { inverted?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-2.5 rounded-lg" aria-label="Courtly home">
      <span className={cn("relative grid size-9 place-items-center rounded-xl", inverted ? "bg-[#cbe86b] text-[#17442f]" : "bg-[#235c43] text-white")}>
        <span className="absolute h-5 w-px rotate-45 bg-current opacity-70" />
        <span className="absolute h-5 w-px -rotate-45 bg-current opacity-70" />
        <span className="size-2.5 rounded-full border-2 border-current bg-transparent" />
      </span>
      {!compact && <span className={cn("display text-xl font-extrabold", inverted ? "text-white" : "text-[#173020]")}>courtly</span>}
    </Link>
  );
}
