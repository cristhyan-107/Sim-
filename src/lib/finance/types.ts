export type Scope = "PF" | "PJ"

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "owner_withdrawal"
  | "invoice_payment"
  | "das_payment"

export type PaymentMethod =
  | "pix"
  | "debit"
  | "credit_card"
  | "cash"
  | "bank_slip"
  | "transfer"
  | "other"

export type InvoiceStatus = "open" | "future" | "paid"
export type InstallmentStatus = "pending" | "paid" | "cancelled"
export type PurchaseStatus = "active" | "cancelled" | "finished"
export type RecurrenceStatus = "active" | "paused" | "finished"
export type RecurrenceFrequency = "weekly" | "monthly" | "yearly"
export type BudgetStatus = "active" | "inactive"

export type Account = {
  id: string
  name: string
  bank: string
  scope: Scope
  role: string
  initial_balance: number
  current_balance: number
  status: "active" | "secondary" | "closed"
}

export type CardAccount = {
  id: string
  nickname: string
  bank: string
  account_id: string
  scope: Scope
  credit_limit: number
  last_four_digits?: string
  closing_day: number
  due_day: number
  status: "active" | "inactive"
}

export type Category = {
  id: string
  name: string
  scope: Scope
  type: "income" | "expense" | "transfer"
}

export type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  category_id: string
  account_id: string
  destination_account_id?: string
  scope: Scope
  payment_method: PaymentMethod
  card_id?: string
  invoice_id?: string
  recurrence_id?: string
  notes?: string
}

export type InstallmentPurchase = {
  id: string
  description: string
  total_amount: number
  installments_count: number
  installment_amount: number
  card_id: string
  category_id: string
  scope: Scope
  purchase_date: string
  first_invoice_month: string
  status: PurchaseStatus
  notes?: string
}

export type Installment = {
  id: string
  purchase_id: string
  card_id: string
  category_id: string
  scope: Scope
  installment_number: number
  total_installments: number
  due_month: string
  amount: number
  status: InstallmentStatus
}

export type Invoice = {
  id: string
  card_id: string
  invoice_month: string
  due_date: string
  status: InvoiceStatus
  paid_from_account_id?: string
  paid_at?: string
  payment_transaction_id?: string
}

export type Recurrence = {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  category_id: string
  account_id: string
  scope: Scope
  frequency: RecurrenceFrequency
  start_date: string
  end_date?: string
  next_due_date: string
  status: RecurrenceStatus
  payment_method: PaymentMethod
  notes?: string
}

export type Budget = {
  id: string
  category_id: string
  scope: Scope
  month: string
  limit_amount: number
  alert_percentage: number
  status: BudgetStatus
  notes?: string
}

export type MonthlyClosing = {
  id: string
  month: string
  notes?: string
  reviewed: boolean
  reviewed_at?: string
}

export type FinanceState = {
  accounts: Account[]
  cards: CardAccount[]
  categories: Category[]
  transactions: Transaction[]
  installmentPurchases: InstallmentPurchase[]
  installments: Installment[]
  invoices: Invoice[]
  recurrences: Recurrence[]
  budgets: Budget[]
  monthlyClosings: MonthlyClosing[]
}
