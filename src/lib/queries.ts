import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { monthRange, parseIsoDate, shiftMonth } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { budgetProgress, computeTotals, monthlySeries, spendingByCategory } from "@/lib/finance";

// Every query here takes userId and filters by it; callers get it from requireUserId().

export type CategoryOption = { id: string; name: string; type: "INCOME" | "EXPENSE"; icon: string; color: string };

export async function getCategories(userId: string): Promise<CategoryOption[]> {
  return getDb().category.findMany({
    where: { userId },
    select: { id: true, name: true, type: true, icon: true, color: true },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });
}

const transactionSelect = {
  id: true,
  type: true,
  amountCents: true,
  date: true,
  description: true,
  note: true,
  merchant: true,
  paymentMethod: true,
  category: { select: { id: true, name: true, icon: true, color: true } },
} satisfies Prisma.TransactionSelect;

export type TransactionRow = Prisma.TransactionGetPayload<{ select: typeof transactionSelect }>;

export async function getBudgetRows(userId: string, monthKey: string) {
  const { start, end } = monthRange(monthKey);
  const db = getDb();
  const [categories, budgets, spent] = await Promise.all([
    db.category.findMany({
      where: { userId, type: "EXPENSE" },
      select: { id: true, name: true, icon: true, color: true },
      orderBy: { createdAt: "asc" },
    }),
    db.budget.findMany({ where: { userId, month: start }, select: { id: true, categoryId: true, amountCents: true } }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
      _sum: { amountCents: true },
    }),
  ]);
  const spentBy = new Map(spent.map((s) => [s.categoryId, s._sum.amountCents ?? 0]));
  const budgetBy = new Map(budgets.map((b) => [b.categoryId, b]));
  return categories.map((category) => {
    const budget = budgetBy.get(category.id);
    const spentCents = spentBy.get(category.id) ?? 0;
    return {
      category,
      budgetId: budget?.id ?? null,
      spentCents,
      progress: budget ? budgetProgress(budget.amountCents, spentCents) : null,
    };
  });
}

export type BudgetRow = Awaited<ReturnType<typeof getBudgetRows>>[number];

export async function getDashboard(userId: string, monthKey: string) {
  const { start, end } = monthRange(monthKey);
  const seriesStart = monthRange(shiftMonth(monthKey, -5)).start;
  const db = getDb();
  const [sixMonths, recent, budgetRows, categories] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: seriesStart, lt: end } },
      select: { type: true, amountCents: true, date: true, categoryId: true },
    }),
    db.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: transactionSelect,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    getBudgetRows(userId, monthKey),
    getCategories(userId),
  ]);

  const monthRows = sixMonths.filter((r) => r.date >= start);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const byCategory = spendingByCategory(monthRows).map((s) => {
    const category = categoryById.get(s.categoryId);
    return {
      name: category?.name ?? "Unknown",
      color: category?.color ?? "#64748b",
      amountCents: s.amountCents,
    };
  });

  return {
    totals: computeTotals(monthRows),
    series: monthlySeries(sixMonths, monthKey, 6),
    byCategory,
    recent,
    budgets: budgetRows.filter((b) => b.progress !== null),
    hasAnyBudget: budgetRows.some((b) => b.progress !== null),
  };
}

export const SORT_OPTIONS = {
  date_desc: { label: "Newest first", orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
  date_asc: { label: "Oldest first", orderBy: [{ date: "asc" }, { createdAt: "asc" }] },
  amount_desc: { label: "Highest amount", orderBy: [{ amountCents: "desc" }, { date: "desc" }] },
  amount_asc: { label: "Lowest amount", orderBy: [{ amountCents: "asc" }, { date: "desc" }] },
} satisfies Record<string, { label: string; orderBy: Prisma.TransactionOrderByWithRelationInput[] }>;

export type SortKey = keyof typeof SORT_OPTIONS;

export const PAGE_SIZE = 20;

export type TransactionFilters = {
  q: string;
  type: "INCOME" | "EXPENSE" | "";
  categoryId: string;
  from: string;
  to: string;
  sort: SortKey;
  page: number;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Turns untrusted search params into safe filter values, dropping anything invalid. */
export function parseFilters(params: Record<string, string | string[] | undefined>): TransactionFilters {
  const type = first(params.type);
  const sort = first(params.sort);
  const from = first(params.from);
  const to = first(params.to);
  const page = Number.parseInt(first(params.page), 10);
  return {
    q: first(params.q).slice(0, 100),
    type: type === "INCOME" || type === "EXPENSE" ? type : "",
    categoryId: first(params.category).slice(0, 50),
    from: parseIsoDate(from) ? from : "",
    to: parseIsoDate(to) ? to : "",
    sort: sort in SORT_OPTIONS ? (sort as SortKey) : "date_desc",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

export async function getTransactions(userId: string, filters: TransactionFilters) {
  const where: Prisma.TransactionWhereInput = { userId };
  if (filters.type) where.type = filters.type;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  const from = filters.from ? parseIsoDate(filters.from) : null;
  const to = filters.to ? parseIsoDate(filters.to) : null;
  if (from || to) {
    where.date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  }
  if (filters.q) {
    where.OR = [
      { description: { contains: filters.q, mode: "insensitive" } },
      { merchant: { contains: filters.q, mode: "insensitive" } },
      { note: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const db = getDb();
  const [total, rows] = await Promise.all([
    db.transaction.count({ where }),
    db.transaction.findMany({
      where,
      select: transactionSelect,
      orderBy: SORT_OPTIONS[filters.sort].orderBy,
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, rows, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
