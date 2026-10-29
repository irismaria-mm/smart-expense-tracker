import { describe, expect, it } from "vitest";
import { currentMonthKey, isValidMonthKey, monthRange, parseIsoDate, shiftMonth, todayIso } from "@/lib/dates";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema, registerSchema, transactionSchema } from "@/lib/validation";

describe("dates", () => {
  it("uses Europe/Tallinn for today and the current month", () => {
    // 22:30 UTC on 31 Oct is already 1 Nov in Tallinn (UTC+2 after DST ends).
    const instant = new Date("2026-10-31T22:30:00Z");
    expect(todayIso(instant)).toBe("2026-11-01");
    expect(currentMonthKey(instant)).toBe("2026-11");
  });

  it("rejects impossible calendar dates", () => {
    expect(parseIsoDate("2026-02-29")).toBeNull();
    expect(parseIsoDate("2028-02-29")?.toISOString()).toBe("2028-02-29T00:00:00.000Z");
    expect(parseIsoDate("2026-13-01")).toBeNull();
    expect(parseIsoDate("26-01-01")).toBeNull();
  });

  it("computes month ranges and shifts", () => {
    const { start, end } = monthRange("2026-12");
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(isValidMonthKey("2026-00")).toBe(false);
    expect(isValidMonthKey("2026-10")).toBe(true);
  });
});

describe("transactionSchema", () => {
  const valid = { type: "EXPENSE", amount: "12,50", date: "2026-10-29", categoryId: "cat1" };

  it("parses amounts into cents and blanks into null", () => {
    const result = transactionSchema.parse({ ...valid, description: "  ", merchant: "Rimi", paymentMethod: "" });
    expect(result.amount).toBe(1250);
    expect(result.description).toBeNull();
    expect(result.merchant).toBe("Rimi");
    expect(result.paymentMethod).toBeNull();
    expect(result.date.toISOString()).toBe("2026-10-29T00:00:00.000Z");
  });

  it("requires amount, date and category with readable messages", () => {
    const result = transactionSchema.safeParse({ type: "EXPENSE", amount: "", date: "", categoryId: "" });
    expect(result.success).toBe(false);
    const errors = result.error!.flatten().fieldErrors;
    expect(errors.amount?.[0]).toBe("Enter an amount.");
    expect(errors.date?.[0]).toBe("Choose a date.");
    expect(errors.categoryId?.[0]).toBe("Choose a category.");
  });

  it("rejects invalid type, negative amount and unknown payment method", () => {
    expect(transactionSchema.safeParse({ ...valid, type: "TRANSFER" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, amount: "-3" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, paymentMethod: "BITCOIN" }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, description: "x".repeat(201) }).success).toBe(false);
  });
});

describe("auth schemas", () => {
  it("normalises email and checks password rules", () => {
    expect(loginSchema.parse({ email: " Iris@Example.COM ", password: "x" }).email).toBe("iris@example.com");
    const short = registerSchema.safeParse({ email: "a@b.ee", password: "short", confirmPassword: "short" });
    expect(short.error!.flatten().fieldErrors.password?.[0]).toBe("Password must be at least 8 characters.");
    const mismatch = registerSchema.safeParse({ email: "a@b.ee", password: "longenough", confirmPassword: "different" });
    expect(mismatch.error!.flatten().fieldErrors.confirmPassword?.[0]).toBe("Passwords do not match.");
    expect(registerSchema.safeParse({ email: "not-an-email", password: "longenough", confirmPassword: "longenough" }).success).toBe(false);
  });
});

describe("rateLimit", () => {
  it("blocks after the limit within the window and resets afterwards", () => {
    const key = `test:${Math.random()}`;
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimit(key, 5, 60_000, t0 + i).allowed).toBe(true);
    const blocked = rateLimit(key, 5, 60_000, t0 + 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(rateLimit(key, 5, 60_000, t0 + 60_001).allowed).toBe(true);
  });

  it("reads the first forwarded client IP", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
