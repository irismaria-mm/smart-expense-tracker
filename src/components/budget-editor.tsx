"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { deleteBudgetAction, saveBudgetAction } from "@/app/actions/budgets";
import { BudgetBar, BudgetStatusBadge } from "@/components/budget-progress";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form-controls";
import type { BudgetProgress } from "@/lib/finance";
import { centsToInput, formatEur } from "@/lib/money";
import type { FormState } from "@/lib/validation";

export function BudgetEditorRow({
  month,
  category,
  budgetId,
  spentCents,
  progress,
}: {
  month: string;
  category: { id: string; name: string; icon: string; color: string };
  budgetId: string | null;
  spentCents: number;
  progress: BudgetProgress | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveBudgetAction, {});
  const [deleting, startDelete] = useTransition();
  const inputId = `budget-${category.id}`;
  const error = state.fieldErrors?.amount?.[0] ?? (!state.ok ? state.message : undefined);

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Budget saved.");
  }, [state]);

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <CategoryIcon icon={category.icon} color={category.color} />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{category.name}</span>
            {progress ? <BudgetStatusBadge progress={progress} /> : <span className="text-xs text-muted-foreground">Not set</span>}
          </div>
          {progress ? (
            <>
              <BudgetBar progress={progress} label={`${category.name} budget`} />
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {formatEur(progress.spentCents)} of {formatEur(progress.budgetCents)} ({progress.percent}%) ·{" "}
                {progress.remainingCents >= 0
                  ? `${formatEur(progress.remainingCents)} left`
                  : `${formatEur(-progress.remainingCents)} over`}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground tabular-nums">Spent {formatEur(spentCents)} this month</p>
          )}
        </div>
      </div>

      <form action={formAction} className="flex items-start gap-2 sm:w-72" noValidate>
        <input type="hidden" name="categoryId" value={category.id} />
        <input type="hidden" name="month" value={month} />
        <div className="flex-1">
          <label htmlFor={inputId} className="sr-only">
            {category.name} monthly budget in euros
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">€</span>
            <Input
              id={inputId}
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              autoComplete="off"
              defaultValue={progress ? centsToInput(progress.budgetCents) : ""}
              className="pl-7"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-error` : undefined}
            />
          </div>
          {error ? (
            <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs font-medium text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <Button type="submit" variant={progress ? "outline" : "default"} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {progress ? "Update" : "Set"}
        </Button>
        {budgetId ? (
          <ConfirmDialog
            title={`Remove ${category.name} budget?`}
            description="The budget for this month will be removed. Your transactions are not affected."
            confirmLabel="Remove"
            pending={deleting}
            onConfirm={() =>
              startDelete(async () => {
                const result = await deleteBudgetAction(budgetId);
                if (result.ok) toast.success(result.message);
                else toast.error(result.message ?? "Could not remove the budget.");
              })
            }
            trigger={
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${category.name} budget`} disabled={deleting}>
                <Trash2 aria-hidden="true" />
              </Button>
            }
          />
        ) : null}
      </form>
    </li>
  );
}
