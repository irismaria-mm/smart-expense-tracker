import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import type { BudgetProgress } from "@/lib/finance";
import { formatEur } from "@/lib/money";
import { cn } from "@/lib/utils";

const STATUS = {
  ok: { label: "On track", icon: CircleCheck, text: "text-income", bar: "bg-income" },
  warning: { label: "80% used", icon: TriangleAlert, text: "text-warning", bar: "bg-amber-500" },
  exceeded: { label: "Over budget", icon: CircleAlert, text: "text-danger", bar: "bg-danger" },
} as const;

export function BudgetStatusBadge({ progress }: { progress: BudgetProgress }) {
  const s = STATUS[progress.status];
  const label = progress.status === "exceeded" && progress.spentCents === progress.budgetCents ? "Limit reached" : s.label;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", s.text)}>
      <s.icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

export function BudgetBar({ progress, label }: { progress: BudgetProgress; label: string }) {
  const s = STATUS[progress.status];
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(progress.percent, 100)}
      aria-valuetext={`${progress.percent}% used`}
    >
      <div className={cn("h-full rounded-full transition-all", s.bar)} style={{ width: `${Math.min(progress.percent, 100)}%` }} />
    </div>
  );
}

export function BudgetSummaryRow({
  category,
  progress,
}: {
  category: { name: string; icon: string; color: string };
  progress: BudgetProgress;
}) {
  return (
    <div className="flex items-center gap-3">
      <CategoryIcon icon={category.icon} color={category.color} />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{category.name}</span>
          <BudgetStatusBadge progress={progress} />
        </div>
        <BudgetBar progress={progress} label={`${category.name} budget`} />
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {formatEur(progress.spentCents)} of {formatEur(progress.budgetCents)} ·{" "}
          {progress.remainingCents >= 0
            ? `${formatEur(progress.remainingCents)} left`
            : `${formatEur(-progress.remainingCents)} over`}
        </p>
      </div>
    </div>
  );
}
