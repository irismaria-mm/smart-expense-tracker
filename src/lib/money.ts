/** Largest accepted single amount: 1,000,000.00 EUR. */
export const MAX_AMOUNT_CENTS = 100_000_000;

const AMOUNT_PATTERN = /^(\d{1,7})(?:[.,](\d{1,2}))?$/;

/**
 * Parses a user-entered EUR amount ("12", "12.5", "12,50", "€12.50")
 * into integer cents without floating-point arithmetic.
 * Returns null unless it is a positive amount with at most two decimals.
 */
export function parseEurToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^€\s*/, "").replace(/\s*€$/, "");
  const match = AMOUNT_PATTERN.exec(cleaned);
  if (!match) return null;
  const euros = Number(match[1]);
  const fraction = (match[2] ?? "").padEnd(2, "0");
  const cents = euros * 100 + Number(fraction);
  if (cents <= 0 || cents > MAX_AMOUNT_CENTS) return null;
  return cents;
}

/** Formats cents as an editable decimal string, e.g. 1250 -> "12.50". */
export function centsToInput(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const eurFormatter = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

/** Display-only formatting; all arithmetic stays in integer cents. */
export function formatEur(cents: number): string {
  return eurFormatter.format(cents / 100);
}
