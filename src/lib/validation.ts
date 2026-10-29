import { z } from "zod";
import { parseIsoDate } from "@/lib/dates";
import { parseEurToCents } from "@/lib/money";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const amountSchema = z
  .string({ error: "Enter an amount." })
  .trim()
  .min(1, "Enter an amount.")
  .transform((value, ctx) => {
    const cents = parseEurToCents(value);
    if (cents === null) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a positive amount up to 1,000,000 with at most two decimals, e.g. 12.50.",
      });
      return z.NEVER;
    }
    return cents;
  });

export const dateSchema = z
  .string({ error: "Choose a date." })
  .trim()
  .min(1, "Choose a date.")
  .transform((value, ctx) => {
    const date = parseIsoDate(value);
    if (!date) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date." });
      return z.NEVER;
    }
    return date;
  });

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], { error: "Choose income or expense." }),
  amount: amountSchema,
  date: dateSchema,
  categoryId: z.string({ error: "Choose a category." }).trim().min(1, "Choose a category.").max(50),
  description: optionalText(200, "Description"),
  note: optionalText(1000, "Note"),
  merchant: optionalText(120, "Merchant"),
  paymentMethod: z
    .union([
      z.enum(["CASH", "DEBIT_CARD", "CREDIT_CARD", "BANK_TRANSFER", "OTHER"]),
      z.literal(""),
    ])
    .optional()
    .transform((v) => (v ? v : null)),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const emailSchema = z
  .string({ error: "Enter your email." })
  .trim()
  .toLowerCase()
  .min(1, "Enter your email.")
  .max(254, "Email is too long.")
  .pipe(z.email("Enter a valid email address."));

export const registerSchema = z
  .object({
    name: optionalText(80, "Name"),
    email: emailSchema,
    password: z
      .string({ error: "Enter a password." })
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be at most 72 characters."),
    confirmPassword: z.string({ error: "Confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Enter your password." }).min(1, "Enter your password.").max(72),
});

export const budgetSchema = z.object({
  categoryId: z.string().trim().min(1).max(50),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Invalid month."),
  amount: amountSchema,
});

/** Shared result shape for form server actions. */
export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}
