import { ArrowDownRight, ArrowUpRight, ChartPie, ChartColumn, PiggyBank, ReceiptText, Scale } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BudgetSummaryRow } from "@/components/budget-progress";
import { CategoryDonut, IncomeExpenseChart } from "@/components/charts";
import { MonthPicker } from "@/components/month-picker";
import { TransactionList } from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { currentMonthKey, formatMonthLabel, isValidMonthKey } from "@/lib/dates";
import { formatEur } from "@/lib/money";
import { getCategories, getDashboard } from "@/lib/queries";
import { requireUserId } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "income" | "expense" | "positive" | "negative";
}) {
  const toneClass = {
    income: "bg-income/10 text-income",
    expense: "bg-primary/10 text-primary",
    positive: "bg-income/10 text-income",
    negative: "bg-danger/10 text-danger",
  }[tone];
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5", toneClass)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("truncate text-xl font-semibold tabular-nums sm:text-2xl", tone === "negative" && "text-danger", tone === "positive" && "text-income")}>
          {value}
        </p>
      </div>
    </Card>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const userId = await requireUserId();
  const params = await searchParams;
  const requested = Array.isArray(params.month) ? params.month[0] : params.month;
  const current = currentMonthKey();
  const month = isValidMonthKey(requested) ? requested : current;
  const isCurrent = month === current;
  const monthWord = isCurrent ? "This month" : "Selected month";

  const [data, categories] = await Promise.all([getDashboard(userId, month), getCategories(userId)]);
  const choices = categories.map(({ id, name, type }) => ({ id, name, type }));
  const { totals } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isCurrent ? "Your finances this month." : `Your finances for ${formatMonthLabel(month)}.`}
          </p>
        </div>
        <MonthPicker month={month} basePath="/dashboard" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={`Income · ${monthWord}`} value={formatEur(totals.incomeCents)} icon={<ArrowUpRight />} tone="income" />
        <StatCard label={`Expenses · ${monthWord}`} value={formatEur(totals.expenseCents)} icon={<ArrowDownRight />} tone="expense" />
        <StatCard
          label={`Balance · ${monthWord}`}
          value={formatEur(totals.balanceCents)}
          icon={<Scale />}
          tone={totals.balanceCents < 0 ? "negative" : "positive"}
        />
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">Balance = income minus expenses recorded in {formatMonthLabel(month)}.</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Spending by category" description={formatMonthLabel(month)} />
          {data.byCategory.length ? (
            <CategoryDonut data={data.byCategory} />
          ) : (
            <EmptyState icon={<ChartPie />} title="No expenses this month" description="Expenses you add for this month will appear here by category." />
          )}
        </Card>
        <Card>
          <CardHeader title="Income vs. expenses" description={`Six months ending ${formatMonthLabel(month)}`} />
          {data.series.some((p) => p.incomeCents || p.expenseCents) ? (
            <IncomeExpenseChart data={data.series} />
          ) : (
            <EmptyState icon={<ChartColumn />} title="Nothing to compare yet" description="Add income and expenses to see how they compare month by month." />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent transactions"
            description={formatMonthLabel(month)}
            action={
              <Button asChild variant="link" size="sm" className="px-0">
                <Link href="/transactions">View all</Link>
              </Button>
            }
          />
          {data.recent.length ? (
            <TransactionList transactions={data.recent} categories={choices} editable={false} />
          ) : (
            <EmptyState icon={<ReceiptText />} title="No transactions this month" description="Use “Add transaction” to record income or an expense." />
          )}
        </Card>
        <Card>
          <CardHeader
            title="Budgets"
            description={formatMonthLabel(month)}
            action={
              <Button asChild variant="link" size="sm" className="px-0">
                <Link href={`/budgets?month=${month}`}>Manage</Link>
              </Button>
            }
          />
          {data.budgets.length ? (
            <div className="flex flex-col gap-5">
              {data.budgets.map((b) => (
                <BudgetSummaryRow key={b.category.id} category={b.category} progress={b.progress!} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<PiggyBank />}
              title="No budgets set"
              description="Set monthly limits for categories to see your progress here."
              action={
                <Button asChild variant="outline">
                  <Link href={`/budgets?month=${month}`}>Set a budget</Link>
                </Button>
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}
