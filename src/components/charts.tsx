"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMonthLabel } from "@/lib/dates";
import { formatEur } from "@/lib/money";

const INCOME_COLOR = "#16a34a";
const EXPENSE_COLOR = "#2563eb";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgb(15 31 61 / 0.08)",
  fontSize: 13,
};

export function CategoryDonut({ data }: { data: { name: string; color: string; amountCents: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.amountCents, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0" role="img" aria-label={`Spending by category: ${data.map((d) => `${d.name} ${formatEur(d.amountCents)}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="amountCents" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatEur(Number(value))} contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total spent</span>
          <span className="text-base font-semibold tabular-nums">{formatEur(total)}</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} aria-hidden="true" />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="font-medium tabular-nums">{formatEur(d.amountCents)}</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
              {total > 0 ? Math.round((d.amountCents * 100) / total) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IncomeExpenseChart({
  data,
}: {
  data: { month: string; incomeCents: number; expenseCents: number }[];
}) {
  const rows = data.map((d) => ({
    label: formatMonthLabel(d.month, "short"),
    Income: d.incomeCents,
    Expenses: d.expenseCents,
  }));
  const summary = data
    .map((d) => `${formatMonthLabel(d.month)}: income ${formatEur(d.incomeCents)}, expenses ${formatEur(d.expenseCents)}`)
    .join("; ");
  return (
    <div className="h-64 w-full" role="img" aria-label={`Income versus expenses over six months. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5b6b85" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 12, fill: "#5b6b85" }}
            tickFormatter={(v: number) => `€${Math.round(v / 100)}`}
          />
          <Tooltip formatter={(value) => formatEur(Number(value))} contentStyle={tooltipStyle} cursor={{ fill: "#eef2f7" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="Income" fill={INCOME_COLOR} radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Expenses" fill={EXPENSE_COLOR} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
