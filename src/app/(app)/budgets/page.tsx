import type { Metadata } from "next";
import { BudgetEditorRow } from "@/components/budget-editor";
import { MonthPicker } from "@/components/month-picker";
import { Card } from "@/components/ui/card";
import { currentMonthKey, formatMonthLabel, isValidMonthKey } from "@/lib/dates";
import { budgetProgress } from "@/lib/finance";
import { formatEur } from "@/lib/money";
import { getBudgetRows } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Budgets" };

export default async function BudgetsPage({ searchParams }: PageProps<"/budgets">) {
  const userId = await requireUserId();
  const params = await searchParams;
  const requested = Array.isArray(params.month) ? params.month[0] : params.month;
  const month = isValidMonthKey(requested) ? requested : currentMonthKey();
  const rows = await getBudgetRows(userId, month);

  const budgeted = rows.filter((r) => r.progress);
  const totalBudget = budgeted.reduce((sum, r) => sum + r.progress!.budgetCents, 0);
  const totalSpent = budgeted.reduce((sum, r) => sum + r.progress!.spentCents, 0);
  const summary = totalBudget > 0 ? budgetProgress(totalBudget, totalSpent) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set monthly spending limits per expense category.</p>
        </div>
        <MonthPicker month={month} basePath="/budgets" />
      </div>

      {summary ? (
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Budgeted categories · {formatMonthLabel(month)}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatEur(summary.spentCents)} <span className="text-base font-normal text-muted-foreground">spent of {formatEur(summary.budgetCents)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Covers only categories with a budget. You get a warning at 80% and an alert at 100%.
          </p>
        </Card>
      ) : null}

      <Card className="p-4 sm:p-6">
        <h2 className="text-base font-semibold">{formatMonthLabel(month)}</h2>
        <p className="text-sm text-muted-foreground">Enter an amount in euros and press Set. Budgets apply to the selected month only.</p>
        <ul className="mt-2 divide-y divide-border">
          {rows.map((row) => (
            <BudgetEditorRow
              key={`${month}-${row.category.id}`}
              month={month}
              category={row.category}
              budgetId={row.budgetId}
              spentCents={row.spentCents}
              progress={row.progress}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}
