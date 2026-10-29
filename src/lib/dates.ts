/**
 * Timezone strategy: transaction dates are calendar dates stored as PostgreSQL
 * DATE and represented in JS as UTC midnight. "Today" and the current month are
 * determined in the app timezone (Europe/Tallinn).
 */
export const APP_TIMEZONE = "Europe/Tallinn";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function currentMonthKey(now: Date = new Date()): string {
  return todayIso(now).slice(0, 7);
}

/** Parses "YYYY-MM-DD" into a UTC-midnight Date, rejecting impossible dates. */
export function parseIsoDate(value: string): Date | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (y < 1900 || y > 2200) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isValidMonthKey(value: string | undefined | null): value is string {
  if (!value) return false;
  const match = MONTH_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 && year >= 1900 && year <= 2200;
}

/** Returns [start, end) of a month key as UTC-midnight dates. */
export function monthRange(monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthKeyOf(date: Date): string {
  return toIsoDate(date).slice(0, 7);
}

export function formatMonthLabel(monthKey: string, style: "long" | "short" = "long"): string {
  const { start } = monthRange(monthKey);
  return new Intl.DateTimeFormat("en-GB", {
    month: style,
    year: style === "long" ? "numeric" : "2-digit",
    timeZone: "UTC",
  }).format(start);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
