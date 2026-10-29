import type { TransactionType } from "@/generated/prisma/enums";

export type CategorySeed = { name: string; type: TransactionType; icon: string; color: string };

export const DEFAULT_CATEGORIES: CategorySeed[] = [
  { name: "Food", type: "EXPENSE", icon: "utensils", color: "#f97316" },
  { name: "Transport", type: "EXPENSE", icon: "bus", color: "#0ea5e9" },
  { name: "Housing", type: "EXPENSE", icon: "house", color: "#6366f1" },
  { name: "Entertainment", type: "EXPENSE", icon: "clapperboard", color: "#ec4899" },
  { name: "Health", type: "EXPENSE", icon: "heart-pulse", color: "#ef4444" },
  { name: "Education", type: "EXPENSE", icon: "graduation-cap", color: "#8b5cf6" },
  { name: "Other", type: "EXPENSE", icon: "shapes", color: "#64748b" },
  { name: "Salary", type: "INCOME", icon: "briefcase", color: "#16a34a" },
  { name: "Freelance", type: "INCOME", icon: "laptop", color: "#0d9488" },
  { name: "Scholarship", type: "INCOME", icon: "graduation-cap", color: "#2563eb" },
  { name: "Gift", type: "INCOME", icon: "gift", color: "#d946ef" },
  { name: "Other", type: "INCOME", icon: "shapes", color: "#64748b" },
];

export const PAYMENT_METHOD_LABELS = {
  CASH: "Cash",
  DEBIT_CARD: "Debit card",
  CREDIT_CARD: "Credit card",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHOD_LABELS;
