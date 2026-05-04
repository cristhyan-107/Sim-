import * as z from "zod"

export const moneySchema = z.number().positive("Informe um valor maior que zero")

export const scopeSchema = z.enum(["PF", "PJ"])

export const paymentMethodSchema = z.enum(["pix", "debit", "credit_card", "cash", "bank_slip", "transfer", "other"])

export const transactionTypeSchema = z.enum([
  "income",
  "expense",
  "transfer",
  "owner_withdrawal",
  "invoice_payment",
  "das_payment",
])

export const budgetSchema = z.object({
  category_id: z.string().min(1),
  scope: scopeSchema,
  month: z.string().min(1),
  limit_amount: moneySchema,
  alert_percentage: z.number().min(1).max(100),
  notes: z.string().optional(),
})
