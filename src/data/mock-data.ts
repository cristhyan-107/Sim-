import { addDays, subDays } from "date-fns"
import { FinanceState } from "@/lib/finance/types"
import { addMonthsToMonth, generateInstallments, toMonth } from "@/lib/finance/engine"

const today = new Date()
const currentMonth = toMonth(today)
const nextMonth = addMonthsToMonth(currentMonth, 1)

export const MOCK_ACCOUNTS = [
  {
    id: "acc_1",
    name: "Nubank PF",
    bank: "Nubank",
    scope: "PF" as const,
    role: "Conta Corrente Pessoal",
    initial_balance: 1500,
    current_balance: 2350.5,
    status: "active" as const,
  },
  {
    id: "acc_2",
    name: "Inter PJ",
    bank: "Banco Inter",
    scope: "PJ" as const,
    role: "Conta Recebimento MEI",
    initial_balance: 5000,
    current_balance: 8450,
    status: "active" as const,
  },
  {
    id: "acc_3",
    name: "Itau PF Reserva",
    bank: "Itau",
    scope: "PF" as const,
    role: "Reserva de Emergencia",
    initial_balance: 10000,
    current_balance: 10050,
    status: "active" as const,
  },
]

export const MOCK_CARDS = [
  {
    id: "card_1",
    nickname: "Nubank Ultravioleta",
    bank: "Nubank",
    account_id: "acc_1",
    scope: "PF" as const,
    credit_limit: 8000,
    last_four_digits: "1234",
    closing_day: 25,
    due_day: 5,
    status: "active" as const,
  },
  {
    id: "card_2",
    nickname: "Inter Black PJ",
    bank: "Banco Inter",
    account_id: "acc_2",
    scope: "PJ" as const,
    credit_limit: 15000,
    last_four_digits: "9876",
    closing_day: 10,
    due_day: 20,
    status: "active" as const,
  },
]

export const MOCK_CATEGORIES = [
  { id: "cat_pf_1", name: "Alimentacao", scope: "PF" as const, type: "expense" as const },
  { id: "cat_pf_2", name: "Moradia", scope: "PF" as const, type: "expense" as const },
  { id: "cat_pf_3", name: "Lazer", scope: "PF" as const, type: "expense" as const },
  { id: "cat_pf_4", name: "Salario/Receita", scope: "PF" as const, type: "income" as const },
  { id: "cat_pf_5", name: "Cartao de credito", scope: "PF" as const, type: "expense" as const },
  { id: "cat_pf_6", name: "Transferencia PF", scope: "PF" as const, type: "transfer" as const },
  { id: "cat_pj_1", name: "Receita de Servicos", scope: "PJ" as const, type: "income" as const },
  { id: "cat_pj_2", name: "Trafego Pago", scope: "PJ" as const, type: "expense" as const },
  { id: "cat_pj_3", name: "Impostos/DAS", scope: "PJ" as const, type: "expense" as const },
  { id: "cat_pj_4", name: "Retirada do Dono", scope: "PJ" as const, type: "expense" as const },
  { id: "cat_pj_5", name: "Software PJ", scope: "PJ" as const, type: "expense" as const },
  { id: "cat_pj_6", name: "Transferencia PJ", scope: "PJ" as const, type: "transfer" as const },
]

export const MOCK_TRANSACTIONS = [
  {
    id: "tx_1",
    date: subDays(today, 2).toISOString().slice(0, 10),
    description: "Cliente A - Desenvolvimento de Site",
    amount: 3500,
    type: "income" as const,
    category_id: "cat_pj_1",
    account_id: "acc_2",
    scope: "PJ" as const,
    payment_method: "pix" as const,
  },
  {
    id: "tx_2",
    date: subDays(today, 5).toISOString().slice(0, 10),
    description: "Meta Ads",
    amount: 500,
    type: "expense" as const,
    category_id: "cat_pj_2",
    account_id: "acc_2",
    card_id: "card_2",
    scope: "PJ" as const,
    payment_method: "credit_card" as const,
  },
  {
    id: "tx_3",
    date: subDays(today, 10).toISOString().slice(0, 10),
    description: "Pro-labore",
    amount: 2000,
    type: "owner_withdrawal" as const,
    category_id: "cat_pj_4",
    account_id: "acc_2",
    destination_account_id: "acc_1",
    scope: "PJ" as const,
    payment_method: "transfer" as const,
  },
  {
    id: "tx_4",
    date: subDays(today, 1).toISOString().slice(0, 10),
    description: "Mercado Atacadao",
    amount: 650,
    type: "expense" as const,
    category_id: "cat_pf_1",
    account_id: "acc_1",
    card_id: "card_1",
    scope: "PF" as const,
    payment_method: "credit_card" as const,
  },
  {
    id: "tx_5",
    date: subDays(today, 15).toISOString().slice(0, 10),
    description: "DAS MEI",
    amount: 75.6,
    type: "das_payment" as const,
    category_id: "cat_pj_3",
    account_id: "acc_2",
    scope: "PJ" as const,
    payment_method: "pix" as const,
  },
]

export const MOCK_INSTALLMENT_PURCHASES = [
  {
    id: "inst_1",
    description: "MacBook Pro M3",
    total_amount: 12000,
    installments_count: 12,
    installment_amount: 1000,
    card_id: "card_2",
    category_id: "cat_pj_5",
    scope: "PJ" as const,
    purchase_date: subDays(today, 45).toISOString().slice(0, 10),
    first_invoice_month: addMonthsToMonth(currentMonth, -1),
    status: "active" as const,
    notes: "Equipamento de trabalho",
  },
  {
    id: "inst_2",
    description: "Curso de gestao financeira",
    total_amount: 1200,
    installments_count: 6,
    installment_amount: 200,
    card_id: "card_1",
    category_id: "cat_pf_3",
    scope: "PF" as const,
    purchase_date: subDays(today, 12).toISOString().slice(0, 10),
    first_invoice_month: currentMonth,
    status: "active" as const,
    notes: "Exemplo 6x de R$ 200",
  },
]

const generatedInstallments = MOCK_INSTALLMENT_PURCHASES.flatMap(generateInstallments).map((installment) => {
  if (installment.purchase_id === "inst_1" && installment.installment_number <= 2) {
    return { ...installment, status: "paid" as const }
  }
  return installment
})

export const MOCK_INSTALLMENTS = MOCK_INSTALLMENT_PURCHASES.map((purchase) => ({
  id: purchase.id,
  description: purchase.description,
  total_amount: purchase.total_amount,
  installments_count: purchase.installments_count,
  installment_amount: purchase.installment_amount,
  card_id: purchase.card_id,
  category_id: purchase.category_id,
  scope: purchase.scope,
  purchase_date: purchase.purchase_date,
  status: purchase.status,
  paid_installments: generatedInstallments.filter((item) => item.purchase_id === purchase.id && item.status === "paid").length,
}))

export const MOCK_INSTALLMENT_ITEMS = generatedInstallments

export const MOCK_INVOICES = [
  {
    id: "fat_1",
    card_id: "card_2",
    invoice_month: currentMonth,
    due_date: addDays(today, 6).toISOString().slice(0, 10),
    status: "open" as const,
  },
  {
    id: "fat_2",
    card_id: "card_1",
    invoice_month: nextMonth,
    due_date: addDays(today, 34).toISOString().slice(0, 10),
    status: "future" as const,
  },
]

export const MOCK_RECURRENCES = [
  {
    id: "rec_1",
    description: "DAS do MEI",
    amount: 75.6,
    type: "expense" as const,
    category_id: "cat_pj_3",
    account_id: "acc_2",
    scope: "PJ" as const,
    frequency: "monthly" as const,
    start_date: subDays(today, 90).toISOString().slice(0, 10),
    next_due_date: addDays(today, 8).toISOString().slice(0, 10),
    status: "active" as const,
    payment_method: "pix" as const,
    notes: "Obrigacao mensal do MEI",
  },
  {
    id: "rec_2",
    description: "ChatGPT",
    amount: 110,
    type: "expense" as const,
    category_id: "cat_pj_5",
    account_id: "acc_2",
    scope: "PJ" as const,
    frequency: "monthly" as const,
    start_date: subDays(today, 60).toISOString().slice(0, 10),
    next_due_date: addDays(today, 4).toISOString().slice(0, 10),
    status: "active" as const,
    payment_method: "credit_card" as const,
  },
  {
    id: "rec_3",
    description: "Internet",
    amount: 140,
    type: "expense" as const,
    category_id: "cat_pf_2",
    account_id: "acc_1",
    scope: "PF" as const,
    frequency: "monthly" as const,
    start_date: subDays(today, 120).toISOString().slice(0, 10),
    next_due_date: addDays(today, 12).toISOString().slice(0, 10),
    status: "active" as const,
    payment_method: "bank_slip" as const,
  },
]

export const MOCK_ALERTS = [
  { id: 1, type: "warning", message: "Fatura Nubank PF vence nos proximos dias.", scope: "PF" as const },
  { id: 2, type: "destructive", message: "DAS deste mes ainda precisa de acompanhamento.", scope: "PJ" as const },
  { id: 3, type: "warning", message: "Ha parcelas futuras comprometendo os proximos meses.", scope: "PJ" as const },
]

export const MOCK_SUMMARY = {
  pf: {
    total_balance: 12400.5,
    income_month: 2000,
    expense_month: 850,
    open_invoices: 1200,
  },
  pj: {
    total_balance: 8450,
    income_month: 3500,
    expense_month: 575.6,
    open_invoices: 3500,
    owner_withdrawals: 2000,
  },
}

export const INITIAL_FINANCE_STATE: FinanceState = {
  accounts: MOCK_ACCOUNTS,
  cards: MOCK_CARDS,
  categories: MOCK_CATEGORIES,
  transactions: MOCK_TRANSACTIONS,
  installmentPurchases: MOCK_INSTALLMENT_PURCHASES,
  installments: MOCK_INSTALLMENT_ITEMS,
  invoices: MOCK_INVOICES,
  recurrences: MOCK_RECURRENCES,
}
