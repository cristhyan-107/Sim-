"use client"

import { SupabaseClient } from "@supabase/supabase-js"
import {
  Account,
  Budget,
  CardAccount,
  Category,
  FinanceState,
  Installment,
  InstallmentPurchase,
  Invoice,
  MonthlyClosing,
  Recurrence,
  Transaction,
} from "@/lib/finance/types"

type TableName =
  | "accounts"
  | "cards"
  | "categories"
  | "transactions"
  | "installment_purchases"
  | "installments"
  | "invoices"
  | "recurrences"
  | "budgets"
  | "monthly_closings"

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function numberValue(value: unknown) {
  return Number(value || 0)
}

export async function loadFinanceState(supabase: SupabaseClient): Promise<FinanceState> {
  const [
    accounts,
    cards,
    categories,
    transactions,
    purchases,
    installments,
    invoices,
    recurrences,
    budgets,
    monthlyClosings,
  ] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at", { ascending: true }),
    supabase.from("cards").select("*").order("created_at", { ascending: true }),
    supabase.from("categories").select("*").order("created_at", { ascending: true }),
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("installment_purchases").select("*").order("created_at", { ascending: false }),
    supabase.from("installments").select("*").order("due_month", { ascending: true }),
    supabase.from("invoices").select("*").order("invoice_month", { ascending: true }),
    supabase.from("recurrences").select("*").order("next_due_date", { ascending: true }),
    supabase.from("budgets").select("*").order("month", { ascending: false }),
    supabase.from("monthly_closings").select("*").order("month", { ascending: false }),
  ])

  const results = [accounts, cards, categories, transactions, purchases, installments, invoices, recurrences, budgets, monthlyClosings]
  const error = results.find((result) => result.error)?.error
  if (error) throw error

  return {
    accounts: (accounts.data || []).map((item): Account => ({
      id: item.id,
      name: item.name,
      bank: item.bank,
      scope: item.scope,
      role: item.role || "",
      initial_balance: numberValue(item.initial_balance),
      current_balance: numberValue(item.initial_balance),
      status: item.status,
      example_data: Boolean(item.example_data),
    })),
    cards: (cards.data || []).map((item): CardAccount => ({
      id: item.id,
      nickname: item.nickname,
      bank: item.bank,
      account_id: item.account_id,
      scope: item.scope,
      credit_limit: numberValue(item.credit_limit),
      last_four_digits: item.last_four_digits || undefined,
      closing_day: item.closing_day,
      due_day: item.due_day,
      status: item.status,
      example_data: Boolean(item.example_data),
    })),
    categories: (categories.data || []).map((item): Category => ({
      id: item.id,
      name: item.name,
      scope: item.scope,
      type: item.type,
      status: item.status,
      example_data: Boolean(item.example_data),
    })),
    transactions: (transactions.data || []).map((item): Transaction => ({
      id: item.id,
      date: item.date,
      description: item.description,
      amount: numberValue(item.amount),
      type: item.type === "card_payment" ? "invoice_payment" : item.type,
      category_id: item.category_id,
      account_id: item.account_id,
      destination_account_id: item.destination_account_id || undefined,
      scope: item.scope,
      payment_method: item.payment_method,
      card_id: item.card_id || undefined,
      invoice_id: item.invoice_id || undefined,
      recurrence_id: item.recurrence_id || undefined,
      notes: item.notes || undefined,
      example_data: Boolean(item.example_data),
    })),
    installmentPurchases: (purchases.data || []).map((item): InstallmentPurchase => ({
      id: item.id,
      description: item.description,
      total_amount: numberValue(item.total_amount),
      installments_count: item.installments_count,
      installment_amount: numberValue(item.installment_amount),
      card_id: item.card_id,
      category_id: item.category_id,
      scope: item.scope,
      purchase_date: item.purchase_date,
      first_invoice_month: item.first_invoice_month,
      status: item.status,
      notes: item.notes || undefined,
      example_data: Boolean(item.example_data),
    })),
    installments: (installments.data || []).map((item): Installment => ({
      id: item.id,
      purchase_id: item.purchase_id,
      card_id: item.card_id,
      category_id: item.category_id,
      scope: item.scope,
      installment_number: item.installment_number,
      total_installments: item.total_installments,
      due_month: item.due_month,
      amount: numberValue(item.amount),
      status: item.status,
      example_data: Boolean(item.example_data),
    })),
    invoices: (invoices.data || []).map((item): Invoice => ({
      id: item.id,
      card_id: item.card_id,
      invoice_month: item.invoice_month,
      due_date: item.due_date,
      status: item.status,
      paid_from_account_id: item.paid_from_account_id || undefined,
      paid_at: item.paid_at || undefined,
      payment_transaction_id: item.payment_transaction_id || undefined,
      example_data: Boolean(item.example_data),
    })),
    recurrences: (recurrences.data || []).map((item): Recurrence => ({
      id: item.id,
      description: item.description,
      amount: numberValue(item.amount),
      type: item.type === "transfer" ? "expense" : item.type,
      category_id: item.category_id,
      account_id: item.account_id,
      scope: item.scope,
      frequency: item.frequency,
      start_date: item.start_date,
      end_date: item.end_date || undefined,
      next_due_date: item.next_due_date,
      status: item.status,
      payment_method: item.payment_method || "pix",
      notes: item.notes || undefined,
      example_data: Boolean(item.example_data),
    })),
    budgets: (budgets.data || []).map((item): Budget => ({
      id: item.id,
      category_id: item.category_id,
      scope: item.scope,
      month: item.month,
      limit_amount: numberValue(item.limit_amount),
      alert_percentage: item.alert_percentage,
      status: item.status || "active",
      notes: item.notes || undefined,
      example_data: Boolean(item.example_data),
    })),
    monthlyClosings: (monthlyClosings.data || []).map((item): MonthlyClosing => ({
      id: item.id,
      month: item.month,
      notes: item.notes || undefined,
      reviewed: item.reviewed,
      reviewed_at: item.reviewed_at || undefined,
      example_data: Boolean(item.example_data),
    })),
  }
}

export async function clearRemoteExampleData(supabase: SupabaseClient, userId: string) {
  const order: TableName[] = [
    "installments",
    "invoices",
    "installment_purchases",
    "transactions",
    "recurrences",
    "budgets",
    "cards",
    "accounts",
    "categories",
    "monthly_closings",
  ]
  for (const table of order) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId).eq("example_data", true)
    if (error) throw error
  }
}

export async function insertRow(supabase: SupabaseClient, table: TableName, row: Record<string, unknown>) {
  const { error } = await supabase.from(table).insert(row as never)
  if (error) throw error
}

export async function updateRow(supabase: SupabaseClient, table: TableName, id: string, row: Record<string, unknown>) {
  const { error } = await supabase.from(table).update(row as never).eq("id", id)
  if (error) throw error
}

export async function deleteRow(supabase: SupabaseClient, table: TableName, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id)
  if (error) throw error
}

export async function auditLog(supabase: SupabaseClient, action: string, entity: string, entityId?: string, metadata?: Record<string, unknown>) {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return
  await supabase.from("audit_logs").insert({
    user_id: data.user.id,
    action,
    entity,
    entity_id: entityId,
    metadata: metadata || {},
  })
}

export async function currentUserId(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getUser()
  return data.user?.id || null
}

export async function clearRemoteFinanceData(supabase: SupabaseClient, userId: string) {
  const order: TableName[] = [
    "installments",
    "invoices",
    "installment_purchases",
    "transactions",
    "recurrences",
    "budgets",
    "cards",
    "accounts",
    "categories",
    "monthly_closings",
  ]
  for (const table of order) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId)
    if (error) throw error
  }
}
