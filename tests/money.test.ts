import { describe, expect, it } from "vitest";
import { centsToInput, formatEur, MAX_AMOUNT_CENTS, parseEurToCents } from "@/lib/money";

describe("parseEurToCents", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12.50", 1250],
    ["12,50", 1250],
    ["0.01", 1],
    ["0,1", 10],
    [" 7.05 ", 705],
    ["€9.99", 999],
    ["9.99 €", 999],
    ["1000000", MAX_AMOUNT_CENTS],
  ])("parses %j as %i cents", (input, expected) => {
    expect(parseEurToCents(input)).toBe(expected);
  });

  it("avoids floating-point errors that Number() * 100 would cause", () => {
    // 0.29 * 100 === 28.999999999999996 and 1.005 style values are classic traps.
    expect(parseEurToCents("0.29")).toBe(29);
    expect(parseEurToCents("19.99")).toBe(1999);
    expect(parseEurToCents("4.35")).toBe(435);
  });

  it.each(["", "0", "0.00", "-5", "abc", "1.234", "12.", ".5", "1e3", "1,000.00", "1000000.01", "12..5", "NaN"])(
    "rejects %j",
    (input) => {
      expect(parseEurToCents(input)).toBeNull();
    },
  );
});

describe("centsToInput / formatEur", () => {
  it("round-trips cents to an editable string", () => {
    expect(centsToInput(1250)).toBe("12.50");
    expect(centsToInput(5)).toBe("0.05");
    expect(parseEurToCents(centsToInput(123456))).toBe(123456);
  });

  it("formats euros for display", () => {
    expect(formatEur(123456)).toBe("€1,234.56");
    expect(formatEur(-500)).toBe("-€5.00");
  });
});
