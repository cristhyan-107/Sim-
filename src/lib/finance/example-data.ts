import { addMonthsToMonth, generateInstallments, getInvoiceDueDate, toMonth, uid } from "@/lib/finance/engine"
import { Account, Budget, CardAccount, Category, FinanceState, InstallmentPurchase, Invoice, Recurrence, Transaction } from "@/lib/finance/types"

const EXAMPLE_SNAPSHOT_PREFIX = "organiza-mei:example-data"
const EXAMPLE_CLEARED_PREFIX = "organiza-mei:example-data-cleared"

function month(offset = 0) {
  return addMonthsToMonth(toMonth(new Date()), offset)
}

function today(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function createExampleFinanceData(existingCategories: Category[] = []): FinanceState {
  const accounts: Account[] = [
    { id: uid("acc"), name: "Nubank PF", bank: "Nubank", scope: "PF", role: "Conta principal PF", initial_balance: 2500, current_balance: 2500, status: "active", example_data: true },
    { id: uid("acc"), name: "Inter PJ", bank: "Inter", scope: "PJ", role: "Conta principal MEI", initial_balance: 4200, current_balance: 4200, status: "active", example_data: true },
    { id: uid("acc"), name: "Itau PF Backup", bank: "Itau", scope: "PF", role: "Conta secundaria", initial_balance: 800, current_balance: 800, status: "secondary", example_data: true },
  ]
  const pf = accounts[0]
  const pj = accounts[1]

  const proposedCategories: Category[] = [
    ...["Alimentacao", "Transporte", "Moradia", "Lazer", "Saude", "Educacao", "Assinaturas pessoais", "Reserva pessoal", "Outros PF"].map((name) => ({ id: uid("cat"), name, scope: "PF" as const, type: "expense" as const, status: "active" as const, example_data: true })),
    ...["Receita", "Trafego pago", "Ferramentas", "Impostos/DAS", "Fornecedores", "Cursos profissionais", "Equipamentos", "Retirada do dono", "Reserva da empresa", "Outros PJ"].map((name) => ({ id: uid("cat"), name, scope: "PJ" as const, type: name === "Receita" ? "income" as const : "expense" as const, status: "active" as const, example_data: true })),
  ]
  const categories = proposedCategories.filter((item) => !existingCategories.some((existing) => existing.scope === item.scope && existing.name === item.name))
  const allCategories = [...existingCategories, ...categories]
  const category = (name: string) => allCategories.find((item) => item.name === name) || allCategories[0] || proposedCategories[0]

  const cards: CardAccount[] = [
    { id: uid("card"), nickname: "Nubank PF", bank: "Nubank", account_id: pf.id, scope: "PF", credit_limit: 5000, last_four_digits: "1234", closing_day: 5, due_day: 12, status: "active", example_data: true },
    { id: uid("card"), nickname: "Inter PJ", bank: "Inter", account_id: pj.id, scope: "PJ", credit_limit: 8000, last_four_digits: "9876", closing_day: 8, due_day: 15, status: "active", example_data: true },
    { id: uid("card"), nickname: "Itau PF", bank: "Itau", account_id: accounts[2].id, scope: "PF", credit_limit: 2500, last_four_digits: "4321", closing_day: 10, due_day: 20, status: "active", example_data: true },
  ]

  const transactions: Transaction[] = [
    { id: uid("tx"), date: today(-10), description: "Cliente pagou", amount: 1000, type: "income", category_id: category("Receita").id, account_id: pj.id, scope: "PJ", payment_method: "pix", example_data: true },
    { id: uid("tx"), date: today(-8), description: "Canva", amount: 35, type: "expense", category_id: category("Ferramentas").id, account_id: pj.id, scope: "PJ", payment_method: "credit_card", card_id: cards[1].id, example_data: true },
    { id: uid("tx"), date: today(-7), description: "Facebook Ads", amount: 300, type: "expense", category_id: category("Trafego pago").id, account_id: pj.id, scope: "PJ", payment_method: "credit_card", card_id: cards[1].id, example_data: true },
    { id: uid("tx"), date: today(-5), description: "Mercado", amount: 120, type: "expense", category_id: category("Alimentacao").id, account_id: pf.id, scope: "PF", payment_method: "debit", example_data: true },
    { id: uid("tx"), date: today(-3), description: "Retirada do dono", amount: 800, type: "owner_withdrawal", category_id: category("Retirada do dono").id, account_id: pj.id, destination_account_id: pf.id, scope: "PJ", payment_method: "transfer", example_data: true },
    { id: uid("tx"), date: today(-2), description: "DAS", amount: 75, type: "das_payment", category_id: category("Impostos/DAS").id, account_id: pj.id, scope: "PJ", payment_method: "pix", example_data: true },
  ]

  const purchases: InstallmentPurchase[] = [
    { id: uid("compra"), description: "Notebook", total_amount: 1200, installments_count: 6, installment_amount: 200, card_id: cards[0].id, category_id: category("Equipamentos").id, scope: "PF", purchase_date: today(-4), first_invoice_month: month(0), status: "active", example_data: true },
    { id: uid("compra"), description: "Ferramenta anual", total_amount: 600, installments_count: 12, installment_amount: 50, card_id: cards[1].id, category_id: category("Ferramentas").id, scope: "PJ", purchase_date: today(-6), first_invoice_month: month(0), status: "active", example_data: true },
  ]
  const installments = purchases.flatMap((purchase) => generateInstallments(purchase).map((item) => ({ ...item, example_data: true })))
  const invoiceMonths = Array.from(new Set(installments.map((item) => `${item.card_id}:${item.due_month}`)))
  const invoices: Invoice[] = invoiceMonths.map((key) => {
    const [cardId, dueMonth] = key.split(":")
    const card = cards.find((item) => item.id === cardId)!
    return { id: uid("fat"), card_id: cardId, invoice_month: dueMonth, due_date: getInvoiceDueDate(card, dueMonth), status: dueMonth > month(0) ? "future" : "open", example_data: true }
  })

  const recurrences: Recurrence[] = [
    { id: uid("rec"), description: "DAS mensal", amount: 75, type: "expense", category_id: category("Impostos/DAS").id, account_id: pj.id, scope: "PJ", frequency: "monthly", start_date: today(-20), next_due_date: today(5), status: "active", payment_method: "pix", example_data: true },
    { id: uid("rec"), description: "ChatGPT", amount: 100, type: "expense", category_id: category("Ferramentas").id, account_id: pj.id, scope: "PJ", frequency: "monthly", start_date: today(-20), next_due_date: today(8), status: "active", payment_method: "credit_card", example_data: true },
    { id: uid("rec"), description: "Canva", amount: 35, type: "expense", category_id: category("Ferramentas").id, account_id: pj.id, scope: "PJ", frequency: "monthly", start_date: today(-20), next_due_date: today(10), status: "active", payment_method: "credit_card", example_data: true },
    { id: uid("rec"), description: "Internet", amount: 120, type: "expense", category_id: category("Moradia").id, account_id: pf.id, scope: "PF", frequency: "monthly", start_date: today(-20), next_due_date: today(12), status: "active", payment_method: "bank_slip", example_data: true },
  ]

  const budgets: Budget[] = [
    { id: uid("orc"), category_id: category("Alimentacao").id, scope: "PF", month: month(0), limit_amount: 800, alert_percentage: 80, status: "active", example_data: true },
    { id: uid("orc"), category_id: category("Lazer").id, scope: "PF", month: month(0), limit_amount: 300, alert_percentage: 80, status: "active", example_data: true },
    { id: uid("orc"), category_id: category("Trafego pago").id, scope: "PJ", month: month(0), limit_amount: 500, alert_percentage: 80, status: "active", example_data: true },
    { id: uid("orc"), category_id: category("Ferramentas").id, scope: "PJ", month: month(0), limit_amount: 200, alert_percentage: 80, status: "active", example_data: true },
  ]

  return { accounts, cards, categories, transactions, installmentPurchases: purchases, installments, invoices, recurrences, budgets, monthlyClosings: [] }
}

export function markFinanceStateAsExample(state: FinanceState): FinanceState {
  return {
    accounts: state.accounts.map((item) => ({ ...item, example_data: true })),
    cards: state.cards.map((item) => ({ ...item, example_data: true })),
    categories: state.categories.map((item) => ({ ...item, example_data: true })),
    transactions: state.transactions.map((item) => ({ ...item, example_data: true })),
    installmentPurchases: state.installmentPurchases.map((item) => ({ ...item, example_data: true })),
    installments: state.installments.map((item) => ({ ...item, example_data: true })),
    invoices: state.invoices.map((item) => ({ ...item, example_data: true })),
    recurrences: state.recurrences.map((item) => ({ ...item, example_data: true })),
    budgets: state.budgets.map((item) => ({ ...item, example_data: true })),
    monthlyClosings: state.monthlyClosings.map((item) => ({ ...item, example_data: true })),
  }
}

function canUseStorage() {
  return typeof window !== "undefined"
}

function snapshotKey(userId: string) {
  return `${EXAMPLE_SNAPSHOT_PREFIX}:${userId}`
}

function clearedKey(userId: string) {
  return `${EXAMPLE_CLEARED_PREFIX}:${userId}`
}

export function hasExampleDataCleared(userId: string | null) {
  if (!canUseStorage() || !userId) return false
  return window.localStorage.getItem(clearedKey(userId)) === "true"
}

export function markExampleDataCleared(userId: string | null) {
  if (!canUseStorage() || !userId) return
  window.localStorage.setItem(clearedKey(userId), "true")
  window.localStorage.removeItem(snapshotKey(userId))
}

export function unmarkExampleDataCleared(userId: string | null) {
  if (!canUseStorage() || !userId) return
  window.localStorage.removeItem(clearedKey(userId))
}

export function readExampleDataSnapshot(userId: string | null): FinanceState | null {
  if (!canUseStorage() || !userId) return null
  try {
    const raw = window.localStorage.getItem(snapshotKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as FinanceState
    return markFinanceStateAsExample(parsed)
  } catch {
    return null
  }
}

export function writeExampleDataSnapshot(userId: string | null, state: FinanceState) {
  if (!canUseStorage() || !userId) return
  window.localStorage.setItem(snapshotKey(userId), JSON.stringify(markFinanceStateAsExample(state)))
  window.localStorage.removeItem(clearedKey(userId))
}

export function clearExampleDataSnapshot(userId: string | null) {
  if (!canUseStorage() || !userId) return
  window.localStorage.removeItem(snapshotKey(userId))
}

export function hasAnyExampleData(state: FinanceState) {
  return [
    ...state.accounts,
    ...state.cards,
    ...state.categories,
    ...state.transactions,
    ...state.installmentPurchases,
    ...state.installments,
    ...state.invoices,
    ...state.recurrences,
    ...state.budgets,
    ...state.monthlyClosings,
  ].some((item) => item.example_data)
}

export function createEmptyFinanceState(): FinanceState {
  return {
    accounts: [],
    cards: [],
    categories: [],
    transactions: [],
    installmentPurchases: [],
    installments: [],
    invoices: [],
    recurrences: [],
    budgets: [],
    monthlyClosings: [],
  }
}
