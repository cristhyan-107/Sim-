import { Scope, TransactionType, PaymentMethod } from "@/lib/finance/types"

export type ImportBatchStatus = "pending" | "reviewing" | "completed"
export type ImportedTransactionStatus = "pending" | "approved" | "ignored" | "duplicate"
export type AttachmentEntityType = "transaction" | "invoice" | "das" | "monthly_closing"
export type DasStatus = "pending" | "paid" | "overdue"
export type GoalStatus = "active" | "paused" | "completed"
export type ImportSource = "csv" | "ofx"

export type CategoryRule = {
  id: string
  keyword: string
  category_id: string
  scope: Scope
  transaction_type: "income" | "expense" | "transfer" | "any"
  priority: number
  active: boolean
  created_at: string
  updated_at: string
  example_data?: boolean
}

export type ImportBatch = {
  id: string
  file_name: string
  file_type: ImportSource
  source_bank: string
  status: ImportBatchStatus
  imported_count: number
  approved_count: number
  ignored_count: number
  duplicate_count: number
  created_at: string
  updated_at: string
  example_data?: boolean
}

export type ImportedTransaction = {
  id: string
  batch_id: string
  raw_date: string
  date: string
  raw_description: string
  description: string
  raw_amount: string
  amount: number
  transaction_type: TransactionType
  suggested_scope: Scope
  suggested_category_id?: string
  selected_scope: Scope
  selected_category_id?: string
  selected_account_id?: string
  selected_card_id?: string
  matched_transaction_id?: string
  duplicate_hash: string
  status: ImportedTransactionStatus
  raw_payload: Record<string, string | number | boolean | null>
  payment_method: PaymentMethod
  created_at: string
  updated_at: string
  example_data?: boolean
}

export type Attachment = {
  id: string
  entity_type: AttachmentEntityType
  entity_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  public_url?: string
  created_at: string
  updated_at: string
  example_data?: boolean
}

export type DasRecord = {
  id: string
  reference_month: string
  due_date: string
  amount: number
  status: DasStatus
  paid_at?: string
  payment_transaction_id?: string
  attachment_id?: string
  notes?: string
  created_at: string
  updated_at: string
  example_data?: boolean
}

export type Goal = {
  id: string
  name: string
  description?: string
  target_amount: number
  current_amount: number
  scope: Scope
  category_id?: string
  deadline?: string
  status: GoalStatus
  account_id?: string
  created_at: string
  updated_at: string
  example_data?: boolean
}

export type Level2UserSettings = {
  mei_annual_limit: number
}

export type Level2State = {
  importBatches: ImportBatch[]
  importedTransactions: ImportedTransaction[]
  categoryRules: CategoryRule[]
  attachments: Attachment[]
  dasRecords: DasRecord[]
  goals: Goal[]
  userSettings: Level2UserSettings
}
