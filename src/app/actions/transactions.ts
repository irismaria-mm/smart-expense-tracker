"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { formDataToObject, transactionSchema, type FormState } from "@/lib/validation";

async function parseAndCheck(userId: string, formData: FormData) {
  const parsed = transactionSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { error: { fieldErrors: parsed.error.flatten().fieldErrors } satisfies FormState };
  }
  const data = parsed.data;
  // The category must belong to this user and match the transaction type.
  const category = await getDb().category.findFirst({
    where: { id: data.categoryId, userId, type: data.type },
    select: { id: true },
  });
  if (!category) {
    return { error: { fieldErrors: { categoryId: ["Choose a valid category."] } } satisfies FormState };
  }
  return { data };
}

function toRecord(data: NonNullable<Awaited<ReturnType<typeof parseAndCheck>>["data"]>) {
  return {
    type: data.type,
    amountCents: data.amount,
    date: data.date,
    categoryId: data.categoryId,
    description: data.description,
    note: data.note,
    merchant: data.merchant,
    paymentMethod: data.paymentMethod,
  };
}

export async function createTransactionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const result = await parseAndCheck(userId, formData);
  if (result.error) return result.error;

  try {
    await getDb().transaction.create({ data: { ...toRecord(result.data), userId } });
  } catch {
    return { message: "Could not save the transaction. Please try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaction added." };
}

export async function updateTransactionAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const result = await parseAndCheck(userId, formData);
  if (result.error) return result.error;

  // updateMany with userId in the filter means another user's id simply matches nothing.
  const { count } = await getDb().transaction.updateMany({
    where: { id, userId },
    data: toRecord(result.data),
  });
  if (count === 0) return { message: "Transaction not found." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaction updated." };
}

export async function deleteTransactionAction(id: string): Promise<FormState> {
  const userId = await requireUserId();
  if (typeof id !== "string" || id.length > 50) return { message: "Transaction not found." };
  const { count } = await getDb().transaction.deleteMany({ where: { id, userId } });
  if (count === 0) return { message: "Transaction not found." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaction deleted." };
}
