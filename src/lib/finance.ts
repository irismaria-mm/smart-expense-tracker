import { monthKeyOf, shiftMonth } from "@/lib/dates";

export type TxType = "INCOME" | "EXPENSE";

export type AmountRow = { type: TxType; amountCents: number };

export type MonthTotals = { incomeCents: number; expenseCents: number; balanceCents: number };

/** Sums income and expenses in integer cents. */
export function computeTotals(rows: AmountRow[]): MonthTotals {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const row of rows) {
    if (row.type === "INCOME") incomeCents += row.amountCents;
    else expenseCents += row.amountCents;
  }
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents };
}

export type MonthlySeriesPoint = { month: string; incomeCents: number; expenseCents: number };

/** Builds a series of `count` months ending at `endMonth`, filling empty months with zeros. */
export function monthlySeries(
  rows: (AmountRow & { date: Date })[],
  endMonth: string,
  count: number,
): MonthlySeriesPoint[] {
  const points = new Map<string, MonthlySeriesPoint>();
  for (let i = count - 1; i >= 0; i--) {
    const month = shiftMonth(endMonth, -i);
    points.set(month, { month, incomeCents: 0, expenseCents: 0 });
  }
  for (const row of rows) {
    const point = points.get(monthKeyOf(row.date));
    if (!point) continue;
    if (row.type === "INCOME") point.incomeCents += row.amountCents;
    else point.expenseCents += row.amountCents;
  }
  return [...points.values()];
}

export type CategorySpend = { categoryId: string; amountCents: number };

/** Groups expense amounts by category, largest first. Income rows are ignored. */
export function spendingByCategory(
  rows: (AmountRow & { categoryId: string })[],
): CategorySpend[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.type !== "EXPENSE") continue;
    totals.set(row.categoryId, (totals.get(row.categoryId) ?? 0) + row.amountCents);
  }
  return [...totals.entries()]
    .map(([categoryId, amountCents]) => ({ categoryId, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);
}

export type BudgetStatus = "ok" | "warning" | "exceeded";

export type BudgetProgress = {
  budgetCents: number;
  spentCents: number;
  remainingCents: number;
  /** Whole percent used, not capped at 100. */
  percent: number;
  status: BudgetStatus;
};

export const BUDGET_WARNING_PERCENT = 80;

/** Budget usage; status turns to warning at 80% and exceeded at 100% or more. */
export function budgetProgress(budgetCents: number, spentCents: number): BudgetProgress {
  const remainingCents = budgetCents - spentCents;
  // Integer comparisons avoid rounding errors right at the thresholds.
  let status: BudgetStatus = "ok";
  if (spentCents * 100 >= budgetCents * 100) status = "exceeded";
  else if (spentCents * 100 >= budgetCents * BUDGET_WARNING_PERCENT) status = "warning";
  const percent = budgetCents > 0 ? Math.floor((spentCents * 100) / budgetCents) : 0;
  return { budgetCents, spentCents, remainingCents, percent, status };
}
