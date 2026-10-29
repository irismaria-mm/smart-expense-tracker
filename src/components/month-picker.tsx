import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatMonthLabel, shiftMonth } from "@/lib/dates";

/** Previous / next month links that keep the user on the same page. */
export function MonthPicker({ month, basePath }: { month: string; basePath: string }) {
  const linkClass =
    "flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-xs">
      <Link href={`${basePath}?month=${shiftMonth(month, -1)}`} className={linkClass} aria-label="Previous month">
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Link>
      <span className="min-w-36 text-center text-sm font-semibold" aria-live="polite">
        {formatMonthLabel(month)}
      </span>
      <Link href={`${basePath}?month=${shiftMonth(month, 1)}`} className={linkClass} aria-label="Next month">
        <ChevronRight className="size-5" aria-hidden="true" />
      </Link>
    </div>
  );
}
