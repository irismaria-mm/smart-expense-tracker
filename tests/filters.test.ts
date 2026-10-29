import { describe, expect, it } from "vitest";
import { parseFilters } from "@/lib/queries";

describe("parseFilters", () => {
  it("keeps valid search params", () => {
    expect(
      parseFilters({ q: " rimi ", type: "EXPENSE", category: "c1", from: "2026-10-01", to: "2026-10-31", sort: "amount_desc", page: "3" }),
    ).toEqual({ q: "rimi", type: "EXPENSE", categoryId: "c1", from: "2026-10-01", to: "2026-10-31", sort: "amount_desc", page: 3 });
  });

  it("drops invalid or hostile values instead of failing", () => {
    expect(
      parseFilters({ type: "ADMIN", from: "2026-02-30", to: "yesterday", sort: "password", page: "-4", q: "x".repeat(500) }),
    ).toEqual({ q: "x".repeat(100), type: "", categoryId: "", from: "", to: "", sort: "date_desc", page: 1 });
  });

  it("uses the first value of repeated params", () => {
    expect(parseFilters({ type: ["INCOME", "EXPENSE"] }).type).toBe("INCOME");
  });
});
