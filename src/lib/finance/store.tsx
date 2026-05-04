"use client"

import * as React from "react"
import { INITIAL_FINANCE_STATE } from "@/data/mock-data"
import {
  FinanceState,
  InstallmentPurchase,
  Invoice,
  Recurrence,
  Transaction,
} from "@/lib/finance/types"
import {
  addByFrequency,
  applyTransactionsToAccounts,
  buildInvoices,
  generateInstallments,
  getInvoiceTotal,
  uid,
} from "@/lib/finance/engine"

type FinanceContextValue = FinanceState & {
  addTransaction: (transaction: Omit<Transaction, "id">) => Transaction
  updateTransaction: (id: string, transaction: Omit<Transaction, "id">) => void
  deleteTransaction: (id: string) => void
  addPurchase: (purchase: Omit<InstallmentPurchase, "id" | "installment_amount" | "status">) => void
  updatePurchase: (id: string, purchase: Omit<InstallmentPurchase, "id" | "installment_amount" | "status">) => void
  cancelPurchase: (id: string) => void
  payInvoice: (invoice: Invoice, accountId: string) => void
  addRecurrence: (recurrence: Omit<Recurrence, "id">) => void
  updateRecurrence: (id: string, recurrence: Omit<Recurrence, "id">) => void
  setRecurrenceStatus: (id: string, status: Recurrence["status"]) => void
  generateTransactionFromRecurrence: (id: string) => void
}

const FinanceContext = React.createContext<FinanceContextValue | null>(null)

function syncState(next: FinanceState): FinanceState {
  const invoices = buildInvoices(next.cards, next.installments, next.invoices)
  return {
    ...next,
    accounts: applyTransactionsToAccounts(next.accounts, next.transactions),
    invoices,
  }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<FinanceState>(() => syncState(INITIAL_FINANCE_STATE))

  const addTransaction = React.useCallback((transaction: Omit<Transaction, "id">) => {
    const created = { ...transaction, id: uid("tx") }
    setState((current) => syncState({ ...current, transactions: [created, ...current.transactions] }))
    return created
  }, [])

  const updateTransaction = React.useCallback((id: string, transaction: Omit<Transaction, "id">) => {
    setState((current) =>
      syncState({
        ...current,
        transactions: current.transactions.map((item) => (item.id === id ? { ...transaction, id } : item)),
      })
    )
  }, [])

  const deleteTransaction = React.useCallback((id: string) => {
    setState((current) => syncState({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }))
  }, [])

  const addPurchase = React.useCallback((purchaseData: Omit<InstallmentPurchase, "id" | "installment_amount" | "status">) => {
    const purchase: InstallmentPurchase = {
      ...purchaseData,
      id: uid("compra"),
      installment_amount: Number((purchaseData.total_amount / purchaseData.installments_count).toFixed(2)),
      status: "active",
    }
    const installments = generateInstallments(purchase)
    setState((current) =>
      syncState({
        ...current,
        installmentPurchases: [purchase, ...current.installmentPurchases],
        installments: [...current.installments, ...installments],
      })
    )
  }, [])

  const updatePurchase = React.useCallback((id: string, purchaseData: Omit<InstallmentPurchase, "id" | "installment_amount" | "status">) => {
    const purchase: InstallmentPurchase = {
      ...purchaseData,
      id,
      installment_amount: Number((purchaseData.total_amount / purchaseData.installments_count).toFixed(2)),
      status: "active",
    }
    const installments = generateInstallments(purchase)
    setState((current) =>
      syncState({
        ...current,
        installmentPurchases: current.installmentPurchases.map((item) => (item.id === id ? purchase : item)),
        installments: [...current.installments.filter((item) => item.purchase_id !== id), ...installments],
      })
    )
  }, [])

  const cancelPurchase = React.useCallback((id: string) => {
    setState((current) =>
      syncState({
        ...current,
        installmentPurchases: current.installmentPurchases.map((item) => (item.id === id ? { ...item, status: "cancelled" } : item)),
        installments: current.installments.map((item) => (item.purchase_id === id ? { ...item, status: "cancelled" } : item)),
      })
    )
  }, [])

  const payInvoice = React.useCallback((invoice: Invoice, accountId: string) => {
    const total = getInvoiceTotal(invoice, state.installments)
    const card = state.cards.find((item) => item.id === invoice.card_id)
    const transaction: Transaction = {
      id: uid("tx"),
      date: new Date().toISOString().slice(0, 10),
      description: `Pagamento fatura ${card?.nickname || "cartao"} ${invoice.invoice_month.slice(5, 7)}/${invoice.invoice_month.slice(0, 4)}`,
      amount: total,
      type: "invoice_payment",
      category_id: state.categories.find((item) => item.name.toLowerCase().includes("cart"))?.id || state.categories[0]?.id || "",
      account_id: accountId,
      scope: card?.scope || "PF",
      payment_method: "transfer",
      card_id: invoice.card_id,
      invoice_id: invoice.id,
    }
    setState((current) =>
      syncState({
        ...current,
        transactions: [transaction, ...current.transactions],
        installments: current.installments.map((item) =>
          item.card_id === invoice.card_id && item.due_month === invoice.invoice_month ? { ...item, status: "paid" } : item
        ),
        invoices: current.invoices.map((item) =>
          item.id === invoice.id
            ? {
                ...item,
                status: "paid",
                paid_from_account_id: accountId,
                paid_at: new Date().toISOString(),
                payment_transaction_id: transaction.id,
              }
            : item
        ),
      })
    )
  }, [state.cards, state.categories, state.installments])

  const addRecurrence = React.useCallback((recurrence: Omit<Recurrence, "id">) => {
    setState((current) => syncState({ ...current, recurrences: [{ ...recurrence, id: uid("rec") }, ...current.recurrences] }))
  }, [])

  const updateRecurrence = React.useCallback((id: string, recurrence: Omit<Recurrence, "id">) => {
    setState((current) =>
      syncState({ ...current, recurrences: current.recurrences.map((item) => (item.id === id ? { ...recurrence, id } : item)) })
    )
  }, [])

  const setRecurrenceStatus = React.useCallback((id: string, status: Recurrence["status"]) => {
    setState((current) =>
      syncState({ ...current, recurrences: current.recurrences.map((item) => (item.id === id ? { ...item, status } : item)) })
    )
  }, [])

  const generateTransactionFromRecurrence = React.useCallback((id: string) => {
    setState((current) => {
      const recurrence = current.recurrences.find((item) => item.id === id)
      if (!recurrence || recurrence.status !== "active") return current
      const transaction: Transaction = {
        id: uid("tx"),
        date: recurrence.next_due_date,
        description: recurrence.description,
        amount: recurrence.amount,
        type: recurrence.description.toLowerCase().includes("das") ? "das_payment" : recurrence.type,
        category_id: recurrence.category_id,
        account_id: recurrence.account_id,
        scope: recurrence.description.toLowerCase().includes("das") ? "PJ" : recurrence.scope,
        payment_method: recurrence.payment_method,
        recurrence_id: recurrence.id,
        notes: recurrence.notes,
      }
      return syncState({
        ...current,
        transactions: [transaction, ...current.transactions],
        recurrences: current.recurrences.map((item) =>
          item.id === id ? { ...item, next_due_date: addByFrequency(item.next_due_date, item.frequency) } : item
        ),
      })
    })
  }, [])

  const value = React.useMemo(
    () => ({
      ...state,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addPurchase,
      updatePurchase,
      cancelPurchase,
      payInvoice,
      addRecurrence,
      updateRecurrence,
      setRecurrenceStatus,
      generateTransactionFromRecurrence,
    }),
    [
      state,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addPurchase,
      updatePurchase,
      cancelPurchase,
      payInvoice,
      addRecurrence,
      updateRecurrence,
      setRecurrenceStatus,
      generateTransactionFromRecurrence,
    ]
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const context = React.useContext(FinanceContext)
  if (!context) {
    throw new Error("useFinance must be used inside FinanceProvider")
  }
  return context
}
