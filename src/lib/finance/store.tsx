"use client"

import * as React from "react"
import { INITIAL_FINANCE_STATE } from "@/data/mock-data"
import {
  clearExampleDataSnapshot,
  createEmptyFinanceState,
  createExampleFinanceData,
  hasAnyExampleData,
  hasExampleDataCleared,
  markExampleDataCleared,
  markFinanceStateAsExample,
  readExampleDataSnapshot,
  unmarkExampleDataCleared,
  writeExampleDataSnapshot,
} from "@/lib/finance/example-data"
import {
  Account,
  CardAccount,
  Category,
  FinanceState,
  Budget,
  InstallmentPurchase,
  Invoice,
  MonthlyClosing,
  Recurrence,
  Transaction,
} from "@/lib/finance/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  auditLog,
  clearRemoteExampleData,
  clearRemoteFinanceData,
  currentUserId,
  deleteRow,
  hasSupabaseEnv,
  insertRow,
  loadFinanceState,
  updateRow,
} from "@/lib/supabase/finance-repository"
import {
  addByFrequency,
  applyTransactionsToAccounts,
  buildInvoices,
  generateInstallments,
  getInvoiceDueDate,
  getInvoiceTotal,
  uid,
} from "@/lib/finance/engine"

type FinanceContextValue = FinanceState & {
  isLoading: boolean
  isSupabaseConnected: boolean
  addAccount: (account: Omit<Account, "id" | "current_balance" | "status">) => void
  updateAccount: (id: string, account: Omit<Account, "id" | "current_balance" | "status">) => void
  inactivateAccount: (id: string) => void
  addCard: (card: Omit<CardAccount, "id" | "status">) => void
  updateCard: (id: string, card: Omit<CardAccount, "id" | "status">) => void
  inactivateCard: (id: string) => void
  addCategory: (category: Omit<Category, "id" | "status">) => void
  updateCategory: (id: string, category: Omit<Category, "id" | "status">) => void
  inactivateCategory: (id: string) => void
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
  addBudget: (budget: Omit<Budget, "id" | "status">) => void
  updateBudget: (id: string, budget: Omit<Budget, "id" | "status">) => void
  deleteBudget: (id: string) => void
  saveMonthlyClosing: (closing: Omit<MonthlyClosing, "id">) => void
  resetMockData: () => void
  populateExampleData: () => void
  clearExampleDataForCurrentUser: () => Promise<void>
  clearExampleData: () => void
  clearAllData: () => void
  hasExampleData: boolean
  onboardingCompleted: boolean
  onboardingSkipped: boolean
  completeOnboarding: () => void
  skipOnboarding: () => void
  reopenOnboarding: () => void
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
  const [state, setState] = React.useState<FinanceState>(() => syncState(markFinanceStateAsExample(INITIAL_FINANCE_STATE)))
  const [userId, setUserId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(hasSupabaseEnv())
  const [onboardingCompleted, setOnboardingCompleted] = React.useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem("organiza-mei:onboarding-completed") === "true"
  )
  const [onboardingSkipped, setOnboardingSkipped] = React.useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem("organiza-mei:onboarding-skipped") === "true"
  )
  const supabase = React.useMemo(() => (hasSupabaseEnv() ? createClient() : null), [])

  React.useEffect(() => {
    let mounted = true
    async function load() {
      if (!supabase) {
        setIsLoading(false)
        return
      }
      let resolvedUserId: string | null = null
      try {
        const id = await currentUserId(supabase)
        if (!mounted) return
        resolvedUserId = id
        setUserId(id)
        if (id) {
          const remote = await loadFinanceState(supabase)
          if (!mounted) return
          if (hasAnyExampleData(remote)) {
            setState(syncState(remote))
            writeExampleDataSnapshot(id, remote)
          } else {
            const snapshot = readExampleDataSnapshot(id)
            if (snapshot && hasAnyExampleData(snapshot)) {
              setState(syncState(snapshot))
            } else if (!hasExampleDataCleared(id)) {
              const seeded = syncState(markFinanceStateAsExample(INITIAL_FINANCE_STATE))
              setState(seeded)
              writeExampleDataSnapshot(id, seeded)
            } else {
              setState(syncState(createEmptyFinanceState()))
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error)
        if (mounted && resolvedUserId && !hasExampleDataCleared(resolvedUserId)) {
          const snapshot = readExampleDataSnapshot(resolvedUserId)
          if (snapshot && hasAnyExampleData(snapshot)) {
            setState(syncState(snapshot))
          } else {
            const seeded = syncState(markFinanceStateAsExample(INITIAL_FINANCE_STATE))
            setState(seeded)
            writeExampleDataSnapshot(resolvedUserId, seeded)
          }
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [supabase])

  const persist = React.useCallback(async (work: (uid: string) => Promise<void>) => {
    if (!supabase || !userId) return
    try {
      await work(userId)
    } catch (error) {
      console.error("Erro ao persistir no Supabase:", error)
    }
  }, [supabase, userId])

  const stripExampleData = React.useCallback((input: FinanceState): FinanceState => ({
    accounts: input.accounts.filter((item) => !item.example_data),
    cards: input.cards.filter((item) => !item.example_data),
    categories: input.categories.filter((item) => !item.example_data),
    transactions: input.transactions.filter((item) => !item.example_data),
    installmentPurchases: input.installmentPurchases.filter((item) => !item.example_data),
    installments: input.installments.filter((item) => !item.example_data),
    invoices: input.invoices.filter((item) => !item.example_data),
    recurrences: input.recurrences.filter((item) => !item.example_data),
    budgets: input.budgets.filter((item) => !item.example_data),
    monthlyClosings: input.monthlyClosings.filter((item) => !item.example_data),
  }), [])

  const addAccount = React.useCallback((account: Omit<Account, "id" | "current_balance" | "status">) => {
    const created: Account = { ...account, id: uid("acc"), current_balance: account.initial_balance, status: "active" }
    setState((current) => syncState({ ...current, accounts: [created, ...current.accounts] }))
    persist(async (uidValue) => {
      await insertRow(supabase!, "accounts", {
        id: created.id,
        user_id: uidValue,
        name: created.name,
        bank: created.bank,
        scope: created.scope,
        role: created.role,
        initial_balance: created.initial_balance,
        status: created.status,
      })
      await auditLog(supabase!, "account_created", "accounts", created.id, { name: created.name })
    })
  }, [persist, supabase])

  const updateAccount = React.useCallback((id: string, account: Omit<Account, "id" | "current_balance" | "status">) => {
    setState((current) => syncState({ ...current, accounts: current.accounts.map((item) => (item.id === id ? { ...item, ...account } : item)) }))
    persist(async () => {
      await updateRow(supabase!, "accounts", id, account)
      await auditLog(supabase!, "account_updated", "accounts", id)
    })
  }, [persist, supabase])

  const inactivateAccount = React.useCallback((id: string) => {
    setState((current) => syncState({ ...current, accounts: current.accounts.map((item) => (item.id === id ? { ...item, status: "closed" } : item)) }))
    persist(async () => {
      await updateRow(supabase!, "accounts", id, { status: "closed" })
      await auditLog(supabase!, "account_inactivated", "accounts", id)
    })
  }, [persist, supabase])

  const addCard = React.useCallback((card: Omit<CardAccount, "id" | "status">) => {
    const created: CardAccount = { ...card, id: uid("card"), status: "active" }
    setState((current) => syncState({ ...current, cards: [created, ...current.cards] }))
    persist(async (uidValue) => {
      await insertRow(supabase!, "cards", { ...created, user_id: uidValue })
      await auditLog(supabase!, "card_created", "cards", created.id, { nickname: created.nickname })
    })
  }, [persist, supabase])

  const updateCard = React.useCallback((id: string, card: Omit<CardAccount, "id" | "status">) => {
    setState((current) => syncState({ ...current, cards: current.cards.map((item) => (item.id === id ? { ...item, ...card } : item)) }))
    persist(async () => {
      await updateRow(supabase!, "cards", id, card)
      await auditLog(supabase!, "card_updated", "cards", id)
    })
  }, [persist, supabase])

  const inactivateCard = React.useCallback((id: string) => {
    setState((current) => syncState({ ...current, cards: current.cards.map((item) => (item.id === id ? { ...item, status: "inactive" } : item)) }))
    persist(async () => {
      await updateRow(supabase!, "cards", id, { status: "inactive" })
      await auditLog(supabase!, "card_inactivated", "cards", id)
    })
  }, [persist, supabase])

  const addCategory = React.useCallback((category: Omit<Category, "id" | "status">) => {
    const created: Category = { ...category, id: uid("cat"), status: "active" }
    setState((current) => syncState({ ...current, categories: [created, ...current.categories] }))
    persist(async (uidValue) => {
      await insertRow(supabase!, "categories", { ...created, user_id: uidValue })
      await auditLog(supabase!, "category_created", "categories", created.id)
    })
  }, [persist, supabase])

  const updateCategory = React.useCallback((id: string, category: Omit<Category, "id" | "status">) => {
    setState((current) => syncState({ ...current, categories: current.categories.map((item) => (item.id === id ? { ...item, ...category } : item)) }))
    persist(async () => {
      await updateRow(supabase!, "categories", id, category)
      await auditLog(supabase!, "category_updated", "categories", id)
    })
  }, [persist, supabase])

  const inactivateCategory = React.useCallback((id: string) => {
    setState((current) => syncState({ ...current, categories: current.categories.map((item) => (item.id === id ? { ...item, status: "inactive" } : item)) }))
    persist(async () => {
      await updateRow(supabase!, "categories", id, { status: "inactive" })
      await auditLog(supabase!, "category_inactivated", "categories", id)
    })
  }, [persist, supabase])

  const addTransaction = React.useCallback((transaction: Omit<Transaction, "id">) => {
    const created = { ...transaction, id: uid("tx") }
    setState((current) => syncState({ ...current, transactions: [created, ...current.transactions] }))
    persist(async (uidValue) => {
      await insertRow(supabase!, "transactions", { ...created, user_id: uidValue, type: created.type === "invoice_payment" ? "card_payment" : created.type })
      await auditLog(supabase!, "transaction_created", "transactions", created.id, { type: created.type })
    })
    return created
  }, [persist, supabase])

  const updateTransaction = React.useCallback((id: string, transaction: Omit<Transaction, "id">) => {
    setState((current) =>
      syncState({
        ...current,
        transactions: current.transactions.map((item) => (item.id === id ? { ...transaction, id } : item)),
      })
    )
    persist(async () => {
      await updateRow(supabase!, "transactions", id, { ...transaction, type: transaction.type === "invoice_payment" ? "card_payment" : transaction.type })
      await auditLog(supabase!, "transaction_updated", "transactions", id)
    })
  }, [persist, supabase])

  const deleteTransaction = React.useCallback((id: string) => {
    setState((current) => syncState({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }))
    persist(async () => {
      await deleteRow(supabase!, "transactions", id)
      await auditLog(supabase!, "transaction_deleted", "transactions", id)
    })
  }, [persist, supabase])

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
    persist(async (uidValue) => {
      await insertRow(supabase!, "installment_purchases", { ...purchase, user_id: uidValue })
      await Promise.all(installments.map((item) => insertRow(supabase!, "installments", { ...item, user_id: uidValue })))
      const card = state.cards.find((item) => item.id === purchase.card_id)
      const months = Array.from(new Set(installments.map((item) => item.due_month)))
      if (card) {
        await Promise.all(months.map((month) => insertRow(supabase!, "invoices", {
          id: uid("fat"),
          user_id: uidValue,
          card_id: card.id,
          invoice_month: month,
          due_date: getInvoiceDueDate(card, month),
          total_amount: installments.filter((item) => item.due_month === month).reduce((total, item) => total + item.amount, 0),
          status: month > new Date().toISOString().slice(0, 7) ? "future" : "open",
        })))
      }
      await auditLog(supabase!, "installment_purchase_created", "installment_purchases", purchase.id)
    })
  }, [persist, state.cards, supabase])

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
    persist(async (uidValue) => {
      await updateRow(supabase!, "installment_purchases", id, purchase)
      await supabase!.from("installments").delete().eq("purchase_id", id)
      await Promise.all(installments.map((item) => insertRow(supabase!, "installments", { ...item, user_id: uidValue })))
      await auditLog(supabase!, "installment_purchase_updated", "installment_purchases", id)
    })
  }, [persist, supabase])

  const cancelPurchase = React.useCallback((id: string) => {
    setState((current) =>
      syncState({
        ...current,
        installmentPurchases: current.installmentPurchases.map((item) => (item.id === id ? { ...item, status: "cancelled" } : item)),
        installments: current.installments.map((item) => (item.purchase_id === id ? { ...item, status: "cancelled" } : item)),
      })
    )
    persist(async () => {
      await updateRow(supabase!, "installment_purchases", id, { status: "cancelled" })
      await supabase!.from("installments").update({ status: "cancelled" }).eq("purchase_id", id)
      await auditLog(supabase!, "installment_purchase_cancelled", "installment_purchases", id)
    })
  }, [persist, supabase])

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
    persist(async (uidValue) => {
      await insertRow(supabase!, "transactions", { ...transaction, user_id: uidValue, type: "card_payment" })
      await updateRow(supabase!, "invoices", invoice.id, {
        status: "paid",
        paid_from_account_id: accountId,
        paid_at: new Date().toISOString(),
        payment_transaction_id: transaction.id,
      })
      await supabase!.from("installments").update({ status: "paid" }).eq("card_id", invoice.card_id).eq("due_month", invoice.invoice_month)
      await auditLog(supabase!, "invoice_paid", "invoices", invoice.id)
    })
  }, [persist, state.cards, state.categories, state.installments, supabase])

  const addRecurrence = React.useCallback((recurrence: Omit<Recurrence, "id">) => {
    const created = { ...recurrence, id: uid("rec") }
    setState((current) => syncState({ ...current, recurrences: [created, ...current.recurrences] }))
    persist(async (uidValue) => {
      await insertRow(supabase!, "recurrences", { ...created, user_id: uidValue })
      await auditLog(supabase!, "recurrence_created", "recurrences", created.id)
    })
  }, [persist, supabase])

  const updateRecurrence = React.useCallback((id: string, recurrence: Omit<Recurrence, "id">) => {
    setState((current) =>
      syncState({ ...current, recurrences: current.recurrences.map((item) => (item.id === id ? { ...recurrence, id } : item)) })
    )
    persist(async () => {
      await updateRow(supabase!, "recurrences", id, recurrence)
      await auditLog(supabase!, "recurrence_updated", "recurrences", id)
    })
  }, [persist, supabase])

  const setRecurrenceStatus = React.useCallback((id: string, status: Recurrence["status"]) => {
    setState((current) =>
      syncState({ ...current, recurrences: current.recurrences.map((item) => (item.id === id ? { ...item, status } : item)) })
    )
    persist(async () => {
      await updateRow(supabase!, "recurrences", id, { status })
      await auditLog(supabase!, "recurrence_status_changed", "recurrences", id, { status })
    })
  }, [persist, supabase])

  const generateTransactionFromRecurrence = React.useCallback((id: string) => {
    const recurrence = state.recurrences.find((item) => item.id === id)
    if (!recurrence || recurrence.status !== "active") return
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
    const nextDueDate = addByFrequency(recurrence.next_due_date, recurrence.frequency)
    setState((current) => {
      return syncState({
        ...current,
        transactions: [transaction, ...current.transactions],
        recurrences: current.recurrences.map((item) =>
          item.id === id ? { ...item, next_due_date: nextDueDate } : item
        ),
      })
    })
    persist(async (uidValue) => {
      await insertRow(supabase!, "transactions", {
        ...transaction,
        user_id: uidValue,
        type: transaction.type === "invoice_payment" ? "card_payment" : transaction.type,
      })
      await updateRow(supabase!, "recurrences", id, { next_due_date: nextDueDate })
      await auditLog(supabase!, "recurrence_generated_transaction", "recurrences", id)
    })
  }, [persist, state.recurrences, supabase])

  const addBudget = React.useCallback((budget: Omit<Budget, "id" | "status">) => {
    const created = { ...budget, id: uid("orc"), status: "active" as const }
    setState((current) => syncState({ ...current, budgets: [created, ...current.budgets] }))
    persist(async (uidValue) => {
      await insertRow(supabase!, "budgets", { ...created, user_id: uidValue })
      await auditLog(supabase!, "budget_created", "budgets", created.id)
    })
  }, [persist, supabase])

  const updateBudget = React.useCallback((id: string, budget: Omit<Budget, "id" | "status">) => {
    setState((current) =>
      syncState({
        ...current,
        budgets: current.budgets.map((item) => (item.id === id ? { ...budget, id, status: "active" } : item)),
      })
    )
    persist(async () => {
      await updateRow(supabase!, "budgets", id, { ...budget, status: "active" })
      await auditLog(supabase!, "budget_updated", "budgets", id)
    })
  }, [persist, supabase])

  const deleteBudget = React.useCallback((id: string) => {
    setState((current) =>
      syncState({
        ...current,
        budgets: current.budgets.map((item) => (item.id === id ? { ...item, status: "inactive" } : item)),
      })
    )
    persist(async () => {
      await updateRow(supabase!, "budgets", id, { status: "inactive" })
      await auditLog(supabase!, "budget_inactivated", "budgets", id)
    })
  }, [persist, supabase])

  const saveMonthlyClosing = React.useCallback((closing: Omit<MonthlyClosing, "id">) => {
    const closingId = uid("fech")
    setState((current) => {
      const existing = current.monthlyClosings.find((item) => item.month === closing.month)
      return syncState({
        ...current,
        monthlyClosings: existing
          ? current.monthlyClosings.map((item) => (item.id === existing.id ? { ...closing, id: existing.id } : item))
          : [{ ...closing, id: closingId }, ...current.monthlyClosings],
      })
    })
    persist(async (uidValue) => {
      const existing = state.monthlyClosings.find((item) => item.month === closing.month)
      if (existing) {
        await updateRow(supabase!, "monthly_closings", existing.id, closing)
        await auditLog(supabase!, "monthly_closing_updated", "monthly_closings", existing.id)
      } else {
        await insertRow(supabase!, "monthly_closings", { ...closing, id: closingId, user_id: uidValue })
        await auditLog(supabase!, "monthly_closing_reviewed", "monthly_closings", closingId)
      }
    })
  }, [persist, state.monthlyClosings, supabase])

  const resetMockData = React.useCallback(() => {
    if (window.confirm("Popular dados de exemplo em memoria local?")) {
      const seeded = syncState(markFinanceStateAsExample(INITIAL_FINANCE_STATE))
      setState(seeded)
      if (userId) {
        unmarkExampleDataCleared(userId)
        writeExampleDataSnapshot(userId, seeded)
      }
    }
  }, [userId])

  const persistStateRows = React.useCallback((example: FinanceState) => {
    persist(async (uidValue) => {
      await Promise.all(example.categories.map((item) => insertRow(supabase!, "categories", { ...item, user_id: uidValue })))
      await Promise.all(example.accounts.map((item) => {
        const { current_balance: currentBalance, ...account } = item
        void currentBalance
        return insertRow(supabase!, "accounts", { ...account, user_id: uidValue })
      }))
      await Promise.all(example.cards.map((item) => insertRow(supabase!, "cards", { ...item, user_id: uidValue })))
      await Promise.all(example.transactions.map((item) => insertRow(supabase!, "transactions", { ...item, user_id: uidValue, type: item.type === "invoice_payment" ? "card_payment" : item.type })))
      await Promise.all(example.installmentPurchases.map((item) => insertRow(supabase!, "installment_purchases", { ...item, user_id: uidValue })))
      await Promise.all(example.installments.map((item) => insertRow(supabase!, "installments", { ...item, user_id: uidValue })))
      await Promise.all(example.invoices.map((item) => insertRow(supabase!, "invoices", { ...item, user_id: uidValue })))
      await Promise.all(example.recurrences.map((item) => insertRow(supabase!, "recurrences", { ...item, user_id: uidValue })))
      await Promise.all(example.budgets.map((item) => insertRow(supabase!, "budgets", { ...item, user_id: uidValue })))
      await auditLog(supabase!, "example_data_created", "system")
    })
  }, [persist, supabase])

  const populateExampleData = React.useCallback(() => {
    if (!window.confirm("Criar dados ficticios de demonstracao para este usuario? Eles serao marcados como exemplo.")) return
    const example = createExampleFinanceData(state.categories)
    const nextState = syncState({
      accounts: [...example.accounts, ...state.accounts],
      cards: [...example.cards, ...state.cards],
      categories: [...example.categories, ...state.categories],
      transactions: [...example.transactions, ...state.transactions],
      installmentPurchases: [...example.installmentPurchases, ...state.installmentPurchases],
      installments: [...example.installments, ...state.installments],
      invoices: [...example.invoices, ...state.invoices],
      recurrences: [...example.recurrences, ...state.recurrences],
      budgets: [...example.budgets, ...state.budgets],
      monthlyClosings: state.monthlyClosings,
    })
    setState(nextState)
    if (userId) {
      unmarkExampleDataCleared(userId)
      writeExampleDataSnapshot(userId, nextState)
    }
    persistStateRows(example)
  }, [
    persistStateRows,
    state.accounts,
    state.budgets,
    state.categories,
    state.cards,
    state.installmentPurchases,
    state.installments,
    state.invoices,
    state.monthlyClosings,
    state.recurrences,
    state.transactions,
    userId,
  ])

  const clearExampleDataForCurrentUser = React.useCallback(async () => {
    const previous = state
    setState((current) => syncState(stripExampleData(current)))
    if (userId) {
      markExampleDataCleared(userId)
    }

    try {
      if (supabase && userId) {
        await clearRemoteExampleData(supabase, userId)
        await auditLog(supabase, "example_data_cleared", "system")
      }
    } catch (error) {
      setState(syncState(previous))
      if (userId) {
        unmarkExampleDataCleared(userId)
        writeExampleDataSnapshot(userId, previous)
      }
      throw error
    }

    if (userId) {
      clearExampleDataSnapshot(userId)
    }
  }, [state, stripExampleData, supabase, userId])

  const clearExampleData = React.useCallback(() => {
    if (!window.confirm("Isso removera apenas os dados de exemplo. Seus dados reais serao preservados.")) return
    clearExampleDataForCurrentUser()
      .then(() => toast.success("Dados de exemplo removidos com sucesso."))
      .catch((error) => {
        console.error("Erro ao limpar dados de exemplo:", error)
        toast.error("Nao foi possivel limpar os dados de exemplo. Tente novamente.")
      })
  }, [clearExampleDataForCurrentUser])

  const clearAllData = React.useCallback(() => {
    if (!window.confirm("Limpar dados financeiros deste usuario? Esta acao remove os dados locais e, se autenticado, tambem os dados no Supabase.")) return
    const empty = createEmptyFinanceState()
    setState(empty)
    if (userId) {
      markExampleDataCleared(userId)
      clearExampleDataSnapshot(userId)
    }
    persist(async (uidValue) => {
      await clearRemoteFinanceData(supabase!, uidValue)
      await auditLog(supabase!, "finance_data_cleared", "system")
    })
  }, [persist, supabase, userId])

  const completeOnboarding = React.useCallback(() => {
    window.localStorage.setItem("organiza-mei:onboarding-completed", "true")
    window.localStorage.removeItem("organiza-mei:onboarding-skipped")
    setOnboardingCompleted(true)
    setOnboardingSkipped(false)
  }, [])

  const skipOnboarding = React.useCallback(() => {
    window.localStorage.setItem("organiza-mei:onboarding-skipped", "true")
    setOnboardingSkipped(true)
  }, [])

  const reopenOnboarding = React.useCallback(() => {
    window.localStorage.removeItem("organiza-mei:onboarding-completed")
    window.localStorage.removeItem("organiza-mei:onboarding-skipped")
    setOnboardingCompleted(false)
    setOnboardingSkipped(false)
  }, [])

  const value = React.useMemo(
    () => ({
      ...state,
      isLoading,
      isSupabaseConnected: Boolean(userId),
      addAccount,
      updateAccount,
      inactivateAccount,
      addCard,
      updateCard,
      inactivateCard,
      addCategory,
      updateCategory,
      inactivateCategory,
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
      addBudget,
      updateBudget,
      deleteBudget,
      saveMonthlyClosing,
      resetMockData,
      populateExampleData,
      clearExampleDataForCurrentUser,
      clearExampleData,
      clearAllData,
      hasExampleData: hasAnyExampleData(state),
      onboardingCompleted,
      onboardingSkipped,
      completeOnboarding,
      skipOnboarding,
      reopenOnboarding,
    }),
    [
      state,
      isLoading,
      userId,
      addAccount,
      updateAccount,
      inactivateAccount,
      addCard,
      updateCard,
      inactivateCard,
      addCategory,
      updateCategory,
      inactivateCategory,
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
      addBudget,
      updateBudget,
      deleteBudget,
      saveMonthlyClosing,
      resetMockData,
      populateExampleData,
      clearExampleDataForCurrentUser,
      clearExampleData,
      clearAllData,
      onboardingCompleted,
      onboardingSkipped,
      completeOnboarding,
      skipOnboarding,
      reopenOnboarding,
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
