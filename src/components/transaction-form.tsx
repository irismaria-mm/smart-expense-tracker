"use client";

import { Loader2, Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createTransactionAction, updateTransactionAction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form-controls";
import { PAYMENT_METHOD_LABELS } from "@/lib/categories";
import { todayIso, toIsoDate } from "@/lib/dates";
import { centsToInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/validation";

export type CategoryChoice = { id: string; name: string; type: "INCOME" | "EXPENSE" };

export type EditableTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  date: Date;
  description: string | null;
  note: string | null;
  merchant: string | null;
  paymentMethod: string | null;
  category: { id: string };
};

function TransactionFields({
  categories,
  initial,
  onDone,
}: {
  categories: CategoryChoice[];
  initial?: EditableTransaction;
  onDone: () => void;
}) {
  const action = initial ? updateTransactionAction.bind(null, initial.id) : createTransactionAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [type, setType] = useState<"INCOME" | "EXPENSE">(initial?.type ?? "EXPENSE");
  const errors = state.fieldErrors ?? {};
  const options = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onDone();
    }
  }, [state, onDone]);

  const describedBy = (name: string) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {!state.ok ? <FormMessage message={state.message} /> : null}

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Type</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {(["EXPENSE", "INCOME"] as const).map((value) => (
            <label
              key={value}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
                type === value
                  ? value === "INCOME"
                    ? "bg-card text-income shadow-sm"
                    : "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              {value === "INCOME" ? "Income" : "Expense"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="amount" label="Amount (EUR)" error={errors.amount}>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            autoComplete="off"
            defaultValue={initial ? centsToInput(initial.amountCents) : ""}
            required
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy("amount")}
          />
        </Field>
        <Field id="date" label="Date" error={errors.date}>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={initial ? toIsoDate(initial.date) : todayIso()}
            required
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describedBy("date")}
          />
        </Field>
      </div>

      <Field id="categoryId" label="Category" error={errors.categoryId}>
        <Select
          id="categoryId"
          name="categoryId"
          key={type}
          defaultValue={initial?.type === type ? initial.category.id : ""}
          required
          aria-invalid={Boolean(errors.categoryId)}
          aria-describedby={describedBy("categoryId")}
        >
          <option value="" disabled>
            Choose a category
          </option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="description" label="Description (optional)" error={errors.description}>
        <Input
          id="description"
          name="description"
          maxLength={200}
          placeholder={type === "INCOME" ? "e.g. October salary" : "e.g. Groceries"}
          defaultValue={initial?.description ?? ""}
          aria-invalid={Boolean(errors.description)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="merchant" label="Merchant (optional)" error={errors.merchant}>
          <Input id="merchant" name="merchant" maxLength={120} defaultValue={initial?.merchant ?? ""} />
        </Field>
        <Field id="paymentMethod" label="Payment method (optional)" error={errors.paymentMethod}>
          <Select id="paymentMethod" name="paymentMethod" defaultValue={initial?.paymentMethod ?? ""}>
            <option value="">Not specified</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field id="note" label="Note (optional)" error={errors.note}>
        <Textarea id="note" name="note" maxLength={1000} rows={2} defaultValue={initial?.note ?? ""} />
      </Field>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {initial ? "Save changes" : "Add transaction"}
      </Button>
    </form>
  );
}

export function AddTransactionButton({
  categories,
  className,
  compact = false,
}: {
  categories: CategoryChoice[];
  className?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className} size={compact ? "icon" : "default"} aria-label="Add transaction">
          <Plus aria-hidden="true" />
          {compact ? null : "Add transaction"}
        </Button>
      </DialogTrigger>
      <DialogContent title="Add transaction" description="Record income or an expense in euros.">
        {open ? <TransactionFields categories={categories} onDone={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export function EditTransactionButton({
  categories,
  transaction,
}: {
  categories: CategoryChoice[];
  transaction: EditableTransaction;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Edit transaction">
          <Pencil aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent title="Edit transaction">
        {open ? (
          <TransactionFields categories={categories} initial={transaction} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
