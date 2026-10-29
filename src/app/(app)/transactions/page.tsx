import { ChevronLeft, ChevronRight, ReceiptText, Search, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AddTransactionButton } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { getCategories, getTransactions, parseFilters, SORT_OPTIONS, type TransactionFilters } from "@/lib/queries";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Transactions" };

function pageHref(filters: TransactionFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.categoryId) params.set("category", filters.categoryId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.sort !== "date_desc") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const userId = await requireUserId();
  const filters = parseFilters(await searchParams);
  const [categories, { rows, total, pageCount }] = await Promise.all([
    getCategories(userId),
    getTransactions(userId, filters),
  ]);
  const choices = categories.map(({ id, name, type }) => ({ id, name, type }));
  const hasFilters = Boolean(filters.q || filters.type || filters.categoryId || filters.from || filters.to);
  const dateRangeInvalid = Boolean(filters.from && filters.to && filters.from > filters.to);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your income and expenses in one place.</p>
        </div>
        <AddTransactionButton categories={choices} className="hidden lg:inline-flex" />
      </div>

      <Card className="p-4 sm:p-5">
        <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6" role="search">
          <Field id="q" label="Search" className="sm:col-span-2 lg:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Description, merchant or note" className="pl-9" maxLength={100} />
            </div>
          </Field>
          <Field id="type" label="Type">
            <Select id="type" name="type" defaultValue={filters.type}>
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </Select>
          </Field>
          <Field id="category" label="Category">
            <Select id="category" name="category" defaultValue={filters.categoryId}>
              <option value="">All categories</option>
              <optgroup label="Expense">
                {categories.filter((c) => c.type === "EXPENSE").map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="Income">
                {categories.filter((c) => c.type === "INCOME").map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </Select>
          </Field>
          <Field id="from" label="From">
            <Input id="from" name="from" type="date" defaultValue={filters.from} />
          </Field>
          <Field id="to" label="To">
            <Input id="to" name="to" type="date" defaultValue={filters.to} />
          </Field>
          <Field id="sort" label="Sort by" className="lg:col-span-2">
            <Select id="sort" name="sort" defaultValue={filters.sort}>
              {Object.entries(SORT_OPTIONS).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end">
            {hasFilters ? (
              <Button asChild variant="outline" className="flex-1 lg:flex-none">
                <Link href="/transactions">Clear filters</Link>
              </Button>
            ) : null}
            <Button type="submit" className="flex-1 lg:flex-none">Apply filters</Button>
          </div>
        </form>
      </Card>

      <Card className="p-4 sm:p-6">
        {dateRangeInvalid ? (
          <p role="alert" className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            The “From” date is after the “To” date, so no transactions can match.
          </p>
        ) : null}
        {rows.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={<SearchX />}
              title="No matching transactions"
              description="Try a different search term or remove some filters."
              action={<Button asChild variant="outline"><Link href="/transactions">Clear filters</Link></Button>}
            />
          ) : (
            <EmptyState
              icon={<ReceiptText />}
              title="No transactions yet"
              description="Add your first income or expense to start tracking."
              action={<AddTransactionButton categories={choices} />}
            />
          )
        ) : (
          <>
            <p className="mb-1 text-sm text-muted-foreground">
              {total} transaction{total === 1 ? "" : "s"}
            </p>
            <TransactionList transactions={rows} categories={choices} />
            {pageCount > 1 ? (
              <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
                {filters.page > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(filters, filters.page - 1)}><ChevronLeft aria-hidden="true" />Previous</Link>
                  </Button>
                ) : <span />}
                <span className="text-sm text-muted-foreground">Page {Math.min(filters.page, pageCount)} of {pageCount}</span>
                {filters.page < pageCount ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(filters, filters.page + 1)}>Next<ChevronRight aria-hidden="true" /></Link>
                  </Button>
                ) : <span />}
              </nav>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
