import { toast } from "sonner"
import { FinanceState } from "@/lib/finance/types"
import { getInvoiceTotal } from "@/lib/finance/engine"

type CsvValue = string | number | boolean | null | undefined

export function toCsv(rows: Record<string, CsvValue>[]) {
  if (!rows.length) return ""
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const escape = (value: CsvValue) => {
    const text = String(value ?? "")
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [headers.join(";"), ...rows.map((row) => headers.map((header) => escape(row[header])).join(";"))].join("\n")
}

export function downloadCsv(filename: string, rows: Record<string, CsvValue>[]) {
  try {
    const csv = toCsv(rows)
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success(`CSV gerado: ${filename}`)
  } catch {
    toast.error("Nao foi possivel exportar o CSV.")
  }
}

export function datedName(prefix: string, suffix = "") {
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}${suffix ? `-${suffix}` : ""}-${date}.csv`
}

export const csvRows = {
  transactions: (state: FinanceState) => state.transactions.map((item) => ({
    data: item.date,
    descricao: item.description,
    valor: item.amount,
    tipo: item.type,
    escopo: item.scope,
    categoria: state.categories.find((category) => category.id === item.category_id)?.name,
    conta_origem: state.accounts.find((account) => account.id === item.account_id)?.name,
    conta_destino: state.accounts.find((account) => account.id === item.destination_account_id)?.name,
    forma: item.payment_method,
  })),
  accounts: (state: FinanceState) => state.accounts.map((item) => ({
    nome: item.name,
    banco: item.bank,
    escopo: item.scope,
    saldo_atual: item.current_balance,
    status: item.status,
  })),
  cards: (state: FinanceState) => state.cards.map((item) => ({
    apelido: item.nickname,
    banco: item.bank,
    escopo: item.scope,
    limite: item.credit_limit,
    final_identificacao: item.last_four_digits || "",
    fechamento: item.closing_day,
    vencimento: item.due_day,
    status: item.status,
  })),
  categories: (state: FinanceState) => state.categories.map((item) => ({
    nome: item.name,
    escopo: item.scope,
    tipo: item.type,
  })),
  installments: (state: FinanceState) => state.installmentPurchases.map((item) => ({
    descricao: item.description,
    valor_total: item.total_amount,
    parcelas: item.installments_count,
    valor_parcela: item.installment_amount,
    cartao: state.cards.find((card) => card.id === item.card_id)?.nickname,
    escopo: item.scope,
    status: item.status,
  })),
  invoices: (state: FinanceState) => state.invoices.map((item) => ({
    cartao: state.cards.find((card) => card.id === item.card_id)?.nickname,
    mes: item.invoice_month,
    vencimento: item.due_date,
    valor: getInvoiceTotal(item, state.installments),
    status: item.status,
    conta_pagamento: state.accounts.find((account) => account.id === item.paid_from_account_id)?.name,
  })),
  recurrences: (state: FinanceState) => state.recurrences.map((item) => ({
    descricao: item.description,
    valor: item.amount,
    tipo: item.type,
    frequencia: item.frequency,
    proximo_vencimento: item.next_due_date,
    escopo: item.scope,
    status: item.status,
  })),
  budgets: (state: FinanceState) => state.budgets.map((item) => ({
    categoria: state.categories.find((category) => category.id === item.category_id)?.name,
    mes: item.month,
    escopo: item.scope,
    limite: item.limit_amount,
    alerta: item.alert_percentage,
    status: item.status,
  })),
}
