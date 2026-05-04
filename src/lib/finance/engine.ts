import {
  Account,
  Budget,
  CardAccount,
  FinanceState,
  Installment,
  InstallmentPurchase,
  Invoice,
  InvoiceStatus,
  Recurrence,
  RecurrenceFrequency,
  Transaction,
} from "@/lib/finance/types"

export function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function toMonth(date: string | Date) {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00`) : date
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-01`
}

export function monthInput(date: string | Date) {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00`) : date
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`
}

export function addMonthsToMonth(month: string, amount: number) {
  const date = new Date(`${month.slice(0, 7)}-01T00:00:00`)
  date.setMonth(date.getMonth() + amount)
  return toMonth(date)
}

export function addByFrequency(date: string, frequency: RecurrenceFrequency) {
  const next = new Date(`${date}T00:00:00`)
  if (frequency === "weekly") next.setDate(next.getDate() + 7)
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1)
  if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1)
  return next.toISOString().slice(0, 10)
}

export function getInvoiceDueDate(card: CardAccount, invoiceMonth: string) {
  const date = new Date(`${invoiceMonth.slice(0, 7)}-01T00:00:00`)
  date.setMonth(date.getMonth() + 1)
  date.setDate(Math.min(card.due_day, 28))
  return date.toISOString().slice(0, 10)
}

export function generateInstallments(purchase: InstallmentPurchase): Installment[] {
  return Array.from({ length: purchase.installments_count }, (_, index) => ({
    id: uid("parcela"),
    purchase_id: purchase.id,
    card_id: purchase.card_id,
    category_id: purchase.category_id,
    scope: purchase.scope,
    installment_number: index + 1,
    total_installments: purchase.installments_count,
    due_month: addMonthsToMonth(purchase.first_invoice_month, index),
    amount: purchase.installment_amount,
    status: "pending",
  }))
}

export function invoiceKey(cardId: string, month: string) {
  return `${cardId}:${month.slice(0, 7)}`
}

export function buildInvoices(cards: CardAccount[], installments: Installment[], existing: Invoice[]) {
  const byKey = new Map(existing.map((invoice) => [invoiceKey(invoice.card_id, invoice.invoice_month), invoice]))
  const currentMonth = toMonth(new Date())

  installments
    .filter((installment) => installment.status !== "cancelled")
    .forEach((installment) => {
      const key = invoiceKey(installment.card_id, installment.due_month)
      if (byKey.has(key)) return
      const card = cards.find((item) => item.id === installment.card_id)
      if (!card) return
      const status: InvoiceStatus = installment.due_month > currentMonth ? "future" : "open"
      byKey.set(key, {
        id: uid("fat"),
        card_id: installment.card_id,
        invoice_month: installment.due_month,
        due_date: getInvoiceDueDate(card, installment.due_month),
        status,
      })
    })

  return Array.from(byKey.values()).sort((a, b) => a.invoice_month.localeCompare(b.invoice_month))
}

export function getInvoiceTotal(invoice: Invoice, installments: Installment[]) {
  return installments
    .filter((item) => item.card_id === invoice.card_id && item.due_month === invoice.invoice_month && item.status !== "cancelled")
    .reduce((total, item) => total + item.amount, 0)
}

export function applyTransactionsToAccounts(accounts: Account[], transactions: Transaction[]) {
  return accounts.map((account) => {
    const current_balance = transactions.reduce((balance, transaction) => {
      if (transaction.type === "income" && transaction.account_id === account.id) return balance + transaction.amount
      if (
        ["expense", "invoice_payment", "das_payment"].includes(transaction.type) &&
        transaction.account_id === account.id
      ) {
        return balance - transaction.amount
      }
      if (["transfer", "owner_withdrawal"].includes(transaction.type)) {
        if (transaction.account_id === account.id) return balance - transaction.amount
        if (transaction.destination_account_id === account.id) return balance + transaction.amount
      }
      return balance
    }, account.initial_balance)

    return { ...account, current_balance }
  })
}

export function getUpcomingRecurrences(recurrences: Recurrence[]) {
  const today = new Date()
  const limit = new Date()
  limit.setDate(today.getDate() + 30)
  return recurrences
    .filter((item) => item.status === "active")
    .filter((item) => {
      const due = new Date(`${item.next_due_date}T00:00:00`)
      return due <= limit
    })
    .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
}

export function getCommittedByMonth(installments: Installment[]) {
  return installments
    .filter((item) => item.status === "pending")
    .reduce<Record<string, number>>((acc, item) => {
      const key = item.due_month.slice(0, 7)
      acc[key] = (acc[key] || 0) + item.amount
      return acc
    }, {})
}

export function getCategorySpent(state: FinanceState, categoryId: string, month: string) {
  const expenseTypes = ["expense", "invoice_payment", "das_payment", "owner_withdrawal"]
  const direct = state.transactions
    .filter((item) => item.date.startsWith(month.slice(0, 7)))
    .filter((item) => item.category_id === categoryId && expenseTypes.includes(item.type))
    .reduce((total, item) => total + item.amount, 0)
  const installments = state.installments
    .filter((item) => item.due_month.startsWith(month.slice(0, 7)))
    .filter((item) => item.category_id === categoryId && item.status !== "cancelled")
    .reduce((total, item) => total + item.amount, 0)
  return direct + installments
}

export function getBudgetUsage(state: FinanceState, budget: Budget) {
  const spent = getCategorySpent(state, budget.category_id, budget.month)
  const percent = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0
  return {
    spent,
    percent,
    remaining: Math.max(budget.limit_amount - spent, 0),
    exceeded: Math.max(spent - budget.limit_amount, 0),
    level: percent >= 100 ? "exceeded" : percent >= 90 ? "critical" : percent >= budget.alert_percentage ? "warning" : "ok",
  }
}

export function getMonthTransactions(state: FinanceState, month: string) {
  return state.transactions.filter((item) => item.date.startsWith(month.slice(0, 7)))
}

export function getMonthlyClosingSnapshot(state: FinanceState, month: string) {
  const transactions = getMonthTransactions(state, month)
  const expenseTypes = ["expense", "invoice_payment", "das_payment"]
  const pfIncome = transactions.filter((item) => item.scope === "PF" && item.type === "income").reduce((total, item) => total + item.amount, 0)
  const pjIncome = transactions.filter((item) => item.scope === "PJ" && item.type === "income").reduce((total, item) => total + item.amount, 0)
  const pfExpense = transactions.filter((item) => item.scope === "PF" && expenseTypes.includes(item.type)).reduce((total, item) => total + item.amount, 0)
  const pjExpense = transactions.filter((item) => item.scope === "PJ" && expenseTypes.includes(item.type)).reduce((total, item) => total + item.amount, 0)
  const ownerWithdrawals = transactions.filter((item) => item.type === "owner_withdrawal").reduce((total, item) => total + item.amount, 0)
  const dasPaid = transactions.some((item) => item.type === "das_payment" && item.date.startsWith(month.slice(0, 7)))
  const invoices = state.invoices.filter((item) => item.invoice_month.startsWith(month.slice(0, 7)))
  const paidInvoices = invoices.filter((item) => item.status === "paid").length
  const openInvoices = invoices.filter((item) => item.status !== "paid").length
  const futureInstallments = state.installments
    .filter((item) => item.status === "pending" && item.due_month > `${month.slice(0, 7)}-01`)
    .reduce((total, item) => total + item.amount, 0)
  const overdueInvoices = invoices.filter((item) => item.status !== "paid" && item.due_date < new Date().toISOString().slice(0, 10)).length
  const exceededBudgets = state.budgets.filter((budget) => budget.month.startsWith(month.slice(0, 7)) && getBudgetUsage(state, budget).level === "exceeded").length
  const accounts = applyTransactionsToAccounts(state.accounts, state.transactions.filter((item) => item.date <= `${month.slice(0, 7)}-31`))

  return {
    pfIncome,
    pfExpense,
    pfResult: pfIncome - pfExpense,
    pjIncome,
    pjExpense,
    pjResult: pjIncome - pjExpense,
    ownerWithdrawals,
    dasPaid,
    paidInvoices,
    openInvoices,
    pfEndingCash: accounts.filter((item) => item.scope === "PF").reduce((total, item) => total + item.current_balance, 0),
    pjEndingCash: accounts.filter((item) => item.scope === "PJ").reduce((total, item) => total + item.current_balance, 0),
    futureInstallments,
    overdueInvoices,
    exceededBudgets,
  }
}

export function getMonthlySeries(state: FinanceState, months: string[]) {
  let pfBalance = state.accounts.filter((item) => item.scope === "PF").reduce((total, item) => total + item.initial_balance, 0)
  let pjBalance = state.accounts.filter((item) => item.scope === "PJ").reduce((total, item) => total + item.initial_balance, 0)

  return months.map((month) => {
    const snapshot = getMonthlyClosingSnapshot(state, `${month}-01`)
    pfBalance += snapshot.pfResult + snapshot.ownerWithdrawals
    pjBalance += snapshot.pjResult - snapshot.ownerWithdrawals
    return {
      month,
      Entradas: snapshot.pfIncome + snapshot.pjIncome,
      Saidas: snapshot.pfExpense + snapshot.pjExpense,
      PF: snapshot.pfExpense,
      PJ: snapshot.pjExpense,
      ResultadoMEI: snapshot.pjResult,
      Retiradas: snapshot.ownerWithdrawals,
      SaldoPF: pfBalance,
      SaldoPJ: pjBalance,
    }
  })
}

export function getFinanceSummary(state: FinanceState) {
  const accounts = applyTransactionsToAccounts(state.accounts, state.transactions)
  const month = monthInput(new Date())
  const monthTransactions = state.transactions.filter((item) => item.date.startsWith(month))
  const expenseTypes = ["expense", "invoice_payment", "das_payment", "owner_withdrawal"]
  const openInvoices = state.invoices.filter((invoice) => invoice.status !== "paid")
  const totalOpenInvoices = openInvoices.reduce((total, invoice) => total + getInvoiceTotal(invoice, state.installments), 0)
  const futureInstallments = state.installments
    .filter((item) => item.status === "pending")
    .reduce((total, item) => total + item.amount, 0)

  return {
    pf: {
      total_balance: accounts.filter((account) => account.scope === "PF").reduce((total, account) => total + account.current_balance, 0),
      income_month: monthTransactions.filter((item) => item.scope === "PF" && item.type === "income").reduce((total, item) => total + item.amount, 0),
      expense_month: monthTransactions.filter((item) => item.scope === "PF" && expenseTypes.includes(item.type)).reduce((total, item) => total + item.amount, 0),
      open_invoices: totalOpenInvoices,
    },
    pj: {
      total_balance: accounts.filter((account) => account.scope === "PJ").reduce((total, account) => total + account.current_balance, 0),
      income_month: monthTransactions.filter((item) => item.scope === "PJ" && item.type === "income").reduce((total, item) => total + item.amount, 0),
      expense_month: monthTransactions.filter((item) => item.scope === "PJ" && expenseTypes.includes(item.type)).reduce((total, item) => total + item.amount, 0),
      open_invoices: totalOpenInvoices,
      owner_withdrawals: monthTransactions.filter((item) => item.type === "owner_withdrawal").reduce((total, item) => total + item.amount, 0),
    },
    futureInstallments,
    committedByMonth: getCommittedByMonth(state.installments),
    upcomingRecurrences: getUpcomingRecurrences(state.recurrences),
  }
}
