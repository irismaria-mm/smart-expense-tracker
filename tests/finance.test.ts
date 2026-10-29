import { describe, expect, it } from "vitest";
import { budgetProgress, computeTotals, monthlySeries, spendingByCategory } from "@/lib/finance";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("computeTotals", () => {
  it("sums income and expenses separately in integer cents", () => {
    const totals = computeTotals([
      { type: "INCOME", amountCents: 150000 },
      { type: "EXPENSE", amountCents: 1999 },
      { type: "EXPENSE", amountCents: 1 },
      { type: "INCOME", amountCents: 10 },
    ]);
    expect(totals).toEqual({ incomeCents: 150010, expenseCents: 2000, balanceCents: 148010 });
  });

  it("returns zeros for no transactions and supports negative balances", () => {
    expect(computeTotals([])).toEqual({ incomeCents: 0, expenseCents: 0, balanceCents: 0 });
    expect(computeTotals([{ type: "EXPENSE", amountCents: 500 }]).balanceCents).toBe(-500);
  });

  it("stays exact where float sums would drift", () => {
    const rows = Array.from({ length: 10 }, () => ({ type: "EXPENSE" as const, amountCents: 10 }));
    expect(computeTotals(rows).expenseCents).toBe(100); // 0.1 * 10 in floats is 0.9999999999999999
  });
});

describe("monthlySeries", () => {
  it("returns six months ending at the selected month, filling gaps with zero", () => {
    const series = monthlySeries(
      [
        { type: "INCOME", amountCents: 1000, date: d("2026-10-01") },
        { type: "EXPENSE", amountCents: 300, date: d("2026-10-31") },
        { type: "EXPENSE", amountCents: 200, date: d("2026-06-15") },
        { type: "EXPENSE", amountCents: 999, date: d("2026-04-30") }, // outside the window
        { type: "INCOME", amountCents: 999, date: d("2026-11-01") }, // outside the window
      ],
      "2026-10",
      6,
    );
    expect(series.map((p) => p.month)).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(series[1]).toEqual({ month: "2026-06", incomeCents: 0, expenseCents: 200 });
    expect(series[5]).toEqual({ month: "2026-10", incomeCents: 1000, expenseCents: 300 });
    expect(series[0]).toEqual({ month: "2026-05", incomeCents: 0, expenseCents: 0 });
  });

  it("crosses year boundaries", () => {
    expect(monthlySeries([], "2026-02", 6).map((p) => p.month)).toEqual([
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});

describe("spendingByCategory", () => {
  it("groups expenses only, sorted largest first", () => {
    expect(
      spendingByCategory([
        { type: "EXPENSE", amountCents: 500, categoryId: "food" },
        { type: "EXPENSE", amountCents: 2000, categoryId: "rent" },
        { type: "EXPENSE", amountCents: 700, categoryId: "food" },
        { type: "INCOME", amountCents: 99999, categoryId: "salary" },
      ]),
    ).toEqual([
      { categoryId: "rent", amountCents: 2000 },
      { categoryId: "food", amountCents: 1200 },
    ]);
  });
});

describe("budgetProgress thresholds", () => {
  it("is ok below 80%", () => {
    const p = budgetProgress(10000, 7999);
    expect(p.status).toBe("ok");
    expect(p.percent).toBe(79);
    expect(p.remainingCents).toBe(2001);
  });

  it("warns at exactly 80%", () => {
    expect(budgetProgress(10000, 8000).status).toBe("warning");
    expect(budgetProgress(10000, 9999).status).toBe("warning");
  });

  it("is exceeded at exactly 100% and when overspent", () => {
    expect(budgetProgress(10000, 10000).status).toBe("exceeded");
    const over = budgetProgress(10000, 12000);
    expect(over.status).toBe("exceeded");
    expect(over.percent).toBe(120);
    expect(over.remainingCents).toBe(-2000);
  });

  it("handles thresholds exactly for amounts that do not divide evenly", () => {
    // 80% of 3333 cents is 2666.4: 2666 is below, 2667 is at/above.
    expect(budgetProgress(3333, 2666).status).toBe("ok");
    expect(budgetProgress(3333, 2667).status).toBe("warning");
  });

  it("treats no spending as ok", () => {
    expect(budgetProgress(5000, 0)).toMatchObject({ status: "ok", percent: 0, remainingCents: 5000 });
  });
});
