"use server";

import { revalidatePath } from "next/cache";
import { monthRange } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { budgetSchema, formDataToObject, type FormState } from "@/lib/validation";

export async function saveBudgetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = budgetSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { categoryId, month, amount } = parsed.data;

  const category = await getDb().category.findFirst({
    where: { id: categoryId, userId, type: "EXPENSE" },
    select: { id: true },
  });
  if (!category) return { message: "Category not found." };

  const { start } = monthRange(month);
  await getDb().budget.upsert({
    where: { userId_categoryId_month: { userId, categoryId, month: start } },
    create: { userId, categoryId, month: start, amountCents: amount },
    update: { amountCents: amount },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Budget saved." };
}

export async function deleteBudgetAction(id: string): Promise<FormState> {
  const userId = await requireUserId();
  if (typeof id !== "string" || id.length > 50) return { message: "Budget not found." };
  const { count } = await getDb().budget.deleteMany({ where: { id, userId } });
  if (count === 0) return { message: "Budget not found." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Budget removed." };
}
