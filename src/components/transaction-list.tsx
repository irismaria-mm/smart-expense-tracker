"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteTransactionAction } from "@/app/actions/transactions";
import { CategoryIcon } from "@/components/category-icon";
import { EditTransactionButton, type CategoryChoice } from "@/components/transaction-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PAYMENT_METHOD_LABELS, type PaymentMethodKey } from "@/lib/categories";
import { formatDate } from "@/lib/dates";
import { formatEur } from "@/lib/money";
import { cn } from "@/lib/utils";

export type ListTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  date: Date;
  description: string | null;
  note: string | null;
  merchant: string | null;
  paymentMethod: string | null;
  category: { id: string; name: string; icon: string; color: string };
};

function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <ConfirmDialog
      title="Delete transaction?"
      description="This permanently removes the transaction and updates your totals and budgets."
      confirmLabel="Delete"
      pending={pending}
      onConfirm={() =>
        startTransition(async () => {
          const result = await deleteTransactionAction(id);
          if (result.ok) toast.success(result.message);
          else toast.error(result.message ?? "Could not delete the transaction.");
        })
      }
      trigger={
        <Button variant="ghost" size="icon" aria-label="Delete transaction" disabled={pending}>
          <Trash2 aria-hidden="true" />
        </Button>
      }
    />
  );
}

export function TransactionList({
  transactions,
  categories,
  editable = true,
}: {
  transactions: ListTransaction[];
  categories: CategoryChoice[];
  editable?: boolean;
}) {
  return (
    <ul className="divide-y divide-border">
      {transactions.map((t) => {
        const title = t.description || t.merchant || t.category.name;
        const meta = [
          t.category.name,
          formatDate(t.date),
          t.merchant && t.description ? t.merchant : null,
          t.paymentMethod ? PAYMENT_METHOD_LABELS[t.paymentMethod as PaymentMethodKey] : null,
        ].filter(Boolean);
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <CategoryIcon icon={t.category.icon} color={t.category.color} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{meta.join(" · ")}</p>
              {t.note ? <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground italic">{t.note}</p> : null}
            </div>
            <p
              className={cn(
                "shrink-0 text-sm font-semibold tabular-nums",
                t.type === "INCOME" ? "text-income" : "text-foreground",
              )}
            >
              <span className="sr-only">{t.type === "INCOME" ? "Income" : "Expense"} </span>
              {t.type === "INCOME" ? "+" : "−"}
              {formatEur(t.amountCents)}
            </p>
            {editable ? (
              <div className="flex shrink-0">
                <EditTransactionButton categories={categories} transaction={t} />
                <DeleteButton id={t.id} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
