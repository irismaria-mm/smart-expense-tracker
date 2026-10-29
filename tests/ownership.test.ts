import { beforeEach, describe, expect, it, vi } from "vitest";

// The signed-in user for every action call in this file.
const CURRENT_USER = "user-a";

const db = {
  category: { findFirst: vi.fn() },
  transaction: { create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  budget: { upsert: vi.fn(), deleteMany: vi.fn() },
};

vi.mock("@/lib/db", () => ({ getDb: () => db }));
vi.mock("@/lib/session", () => ({ requireUserId: vi.fn(async () => CURRENT_USER) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { createTransactionAction, updateTransactionAction, deleteTransactionAction } = await import(
  "@/app/actions/transactions"
);
const { saveBudgetAction, deleteBudgetAction } = await import("@/app/actions/budgets");

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(values)) data.set(k, v);
  return data;
}

const validTx = { type: "EXPENSE", amount: "10.00", date: "2026-10-29", categoryId: "cat-of-a" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("transaction actions enforce ownership on the server", () => {
  it("looks up the category scoped to the current user and matching type", async () => {
    db.category.findFirst.mockResolvedValue({ id: "cat-of-a" });
    db.transaction.create.mockResolvedValue({});
    const result = await createTransactionAction({}, form(validTx));
    expect(result.ok).toBe(true);
    expect(db.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cat-of-a", userId: CURRENT_USER, type: "EXPENSE" } }),
    );
    expect(db.transaction.create.mock.calls[0][0].data).toMatchObject({ userId: CURRENT_USER, amountCents: 1000 });
  });

  it("ignores a userId smuggled in the form data", async () => {
    db.category.findFirst.mockResolvedValue({ id: "cat-of-a" });
    db.transaction.create.mockResolvedValue({});
    await createTransactionAction({}, form({ ...validTx, userId: "user-b" }));
    expect(db.transaction.create.mock.calls[0][0].data.userId).toBe(CURRENT_USER);
  });

  it("refuses another user's category", async () => {
    db.category.findFirst.mockResolvedValue(null);
    const result = await createTransactionAction({}, form({ ...validTx, categoryId: "cat-of-b" }));
    expect(result.fieldErrors?.categoryId?.[0]).toBe("Choose a valid category.");
    expect(db.transaction.create).not.toHaveBeenCalled();
  });

  it("does not write invalid input", async () => {
    const result = await createTransactionAction({}, form({ ...validTx, amount: "12.345" }));
    expect(result.fieldErrors?.amount).toBeDefined();
    expect(db.category.findFirst).not.toHaveBeenCalled();
    expect(db.transaction.create).not.toHaveBeenCalled();
  });

  it("scopes updates and deletes by userId and reports other users' records as not found", async () => {
    db.category.findFirst.mockResolvedValue({ id: "cat-of-a" });
    db.transaction.updateMany.mockResolvedValue({ count: 0 });
    const update = await updateTransactionAction("tx-of-b", {}, form(validTx));
    expect(db.transaction.updateMany.mock.calls[0][0].where).toEqual({ id: "tx-of-b", userId: CURRENT_USER });
    expect(update).toEqual({ message: "Transaction not found." });

    db.transaction.deleteMany.mockResolvedValue({ count: 0 });
    const del = await deleteTransactionAction("tx-of-b");
    expect(db.transaction.deleteMany).toHaveBeenCalledWith({ where: { id: "tx-of-b", userId: CURRENT_USER } });
    expect(del.ok).toBeUndefined();
  });
});

describe("budget actions enforce ownership on the server", () => {
  it("only budgets the current user's expense categories", async () => {
    db.category.findFirst.mockResolvedValue(null);
    const refused = await saveBudgetAction({}, form({ categoryId: "cat-of-b", month: "2026-10", amount: "200" }));
    expect(refused.message).toBe("Category not found.");
    expect(db.budget.upsert).not.toHaveBeenCalled();

    db.category.findFirst.mockResolvedValue({ id: "cat-of-a" });
    db.budget.upsert.mockResolvedValue({});
    const saved = await saveBudgetAction({}, form({ categoryId: "cat-of-a", month: "2026-10", amount: "200,50" }));
    expect(saved.ok).toBe(true);
    expect(db.category.findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: "cat-of-a", userId: CURRENT_USER, type: "EXPENSE" } }),
    );
    const upsert = db.budget.upsert.mock.calls[0][0];
    expect(upsert.where.userId_categoryId_month.userId).toBe(CURRENT_USER);
    expect(upsert.create).toMatchObject({ userId: CURRENT_USER, amountCents: 20050 });
    expect(upsert.where.userId_categoryId_month.month.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("scopes budget deletion by userId", async () => {
    db.budget.deleteMany.mockResolvedValue({ count: 0 });
    const result = await deleteBudgetAction("budget-of-b");
    expect(db.budget.deleteMany).toHaveBeenCalledWith({ where: { id: "budget-of-b", userId: CURRENT_USER } });
    expect(result.message).toBe("Budget not found.");
  });
});
