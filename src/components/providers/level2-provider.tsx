"use client"

import * as React from "react"
import { toast } from "sonner"

import { useFinance } from "@/lib/finance/store"
import { createClient } from "@/lib/supabase/client"
import { currentUserId } from "@/lib/supabase/finance-repository"
import { duplicateHash, createDefaultCategoryRules, createImportTransactionDefaults, findDuplicateTransaction } from "@/lib/level2/automation"
import { createBackupPayload, downloadJson, restoreBackupPayload } from "@/lib/level2/backup"
import { type ImportColumnMapping, type ParsedImportRow } from "@/lib/level2/parsers"
import { clearLevel2State, createEmptyLevel2State, loadLevel2State, saveLevel2State } from "@/lib/level2/storage"
import {
  Attachment,
  AttachmentEntityType,
  CategoryRule,
  DasRecord,
  Goal,
  ImportBatch,
  ImportBatchStatus,
  ImportSource,
  ImportedTransaction,
  Level2State,
} from "@/lib/level2/types"
import { Transaction } from "@/lib/finance/types"
import { uid } from "@/lib/finance/engine"

type ImportedRowInput = {
  fileName: string
  fileType: ImportSource
  sourceBank: string
  rows: ParsedImportRow[]
  mapping: ImportColumnMapping
}

type Level2ContextValue = Level2State & {
  isLoading: boolean
  registerImportBatch: (input: ImportedRowInput) => ImportBatch
  updateImportedTransaction: (id: string, patch: Partial<ImportedTransaction>) => void
  approveImportedTransaction: (id: string) => void
  approveManyImportedTransactions: (ids: string[]) => void
  ignoreImportedTransaction: (id: string) => void
  markImportedAsDuplicate: (id: string) => void
  updateBatchStatus: (batchId: string, status: ImportBatchStatus) => void
  addRule: (rule: Omit<CategoryRule, "id" | "created_at" | "updated_at">) => void
  updateRule: (id: string, rule: Omit<CategoryRule, "id" | "created_at" | "updated_at">) => void
  toggleRule: (id: string, active: boolean) => void
  addDasRecord: (record: Omit<DasRecord, "id" | "created_at" | "updated_at">) => void
  updateDasRecord: (id: string, record: Omit<DasRecord, "id" | "created_at" | "updated_at">) => void
  payDasRecord: (id: string, accountId: string) => void
  addGoal: (goal: Omit<Goal, "id" | "created_at" | "updated_at">) => void
  updateGoal: (id: string, goal: Omit<Goal, "id" | "created_at" | "updated_at">) => void
  addToGoal: (id: string, amount: number) => void
  withdrawFromGoal: (id: string, amount: number) => void
  setMeiAnnualLimit: (limit: number) => void
  addAttachment: (input: { entity_type: AttachmentEntityType; entity_id: string; file: File }) => Promise<Attachment>
  removeAttachment: (attachmentId: string) => void
  getAttachment: (attachmentId: string) => Attachment | undefined
  exportBackup: () => void
  restoreBackup: (json: string) => void
  clearImportedData: () => void
}

const Level2Context = React.createContext<Level2ContextValue | null>(null)

function now() {
  return new Date().toISOString()
}

function mapState(state: Level2State): Level2State {
  return {
    ...state,
    importBatches: [...state.importBatches].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    importedTransactions: [...state.importedTransactions].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    categoryRules: [...state.categoryRules].sort((a, b) => b.priority - a.priority),
    attachments: [...state.attachments].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    dasRecords: [...state.dasRecords].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    goals: [...state.goals].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  }
}

function createImportHash(userId: string, rawDate: string, description: string, amount: number, accountId?: string) {
  return duplicateHash({ userId, date: rawDate, description, amount, accountId })
}

export function Level2Provider({ children }: { children: React.ReactNode }) {
  const finance = useFinance()
  const [userId, setUserId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [state, setState] = React.useState<Level2State>(() => createEmptyLevel2State())

  const supabase = React.useMemo(() => createClient(), [])

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const id = await currentUserId(supabase)
        if (!mounted) return
        setUserId(id)
        const snapshot = loadLevel2State(id)
        if (snapshot) {
          const withRules = snapshot.categoryRules.length || !finance.categories.length ? snapshot : { ...snapshot, categoryRules: createDefaultCategoryRules(finance.categories) }
          setState(mapState(withRules))
        } else {
          const seeded = createEmptyLevel2State()
          if (finance.categories.length) {
            seeded.categoryRules = createDefaultCategoryRules(finance.categories)
          }
          setState(mapState(seeded))
          saveLevel2State(id, seeded)
        }
      } catch (error) {
        console.error("Erro ao carregar estado do Nível 2:", error)
        setState(mapState(createEmptyLevel2State()))
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [finance.categories, supabase])

  React.useEffect(() => {
    if (!userId) return
    saveLevel2State(userId, state)
  }, [state, userId])

  const registerImportBatch = React.useCallback((input: ImportedRowInput) => {
    if (!userId) {
      throw new Error("Usuário não autenticado")
    }
    const batchId = uid("batch")
    const importedAt = now()
    const importedTransactions = input.rows.map((row) => {
      const mapped = {
        raw_date: row[input.mapping.date] || "",
        raw_description: row[input.mapping.description] || "",
        raw_amount: row[input.mapping.amount] || "",
        raw_type: input.mapping.type ? row[input.mapping.type] || "" : "",
      }
      const amount = Number(String(mapped.raw_amount).replace(".", "").replace(",", ".")) || 0
      const defaults = createImportTransactionDefaults({
        date: mapped.raw_date || new Date().toISOString().slice(0, 10),
        description: mapped.raw_description || "",
        amount,
        finance,
        rules: state.categoryRules,
      })
      const duplicate = findDuplicateTransaction(
        {
          date: mapped.raw_date || new Date().toISOString().slice(0, 10),
          description: mapped.raw_description || "",
          amount,
          selected_account_id: defaults.account_id,
        },
        finance
      )
      return {
        id: uid("imp"),
        batch_id: batchId,
        raw_date: mapped.raw_date || "",
        date: mapped.raw_date || new Date().toISOString().slice(0, 10),
        raw_description: mapped.raw_description || "",
        description: mapped.raw_description || "",
        raw_amount: mapped.raw_amount || "",
        amount,
        transaction_type: defaults.type,
        suggested_scope: defaults.scope,
        suggested_category_id: defaults.category_id || undefined,
        selected_scope: defaults.scope,
        selected_category_id: defaults.category_id || undefined,
        selected_account_id: defaults.account_id || undefined,
        selected_card_id: defaults.card_id || undefined,
        matched_transaction_id: duplicate?.id,
        duplicate_hash: createImportHash(userId, mapped.raw_date || "", mapped.raw_description || "", amount, defaults.account_id),
        status: duplicate ? "duplicate" : "pending",
        raw_payload: row,
        payment_method: defaults.payment_method,
        created_at: importedAt,
        updated_at: importedAt,
      } satisfies ImportedTransaction
    })

    const batch: ImportBatch = {
      id: batchId,
      file_name: input.fileName,
      file_type: input.fileType,
      source_bank: input.sourceBank || "Desconhecido",
      status: "pending",
      imported_count: importedTransactions.length,
      approved_count: 0,
      ignored_count: 0,
      duplicate_count: importedTransactions.filter((item) => item.status === "duplicate").length,
      created_at: importedAt,
      updated_at: importedAt,
    }

    setState((current) => mapState({
      ...current,
      importBatches: [batch, ...current.importBatches],
      importedTransactions: [...importedTransactions, ...current.importedTransactions],
    }))

    toast.success(`Importacao criada com ${importedTransactions.length} item(ns).`)
    return batch
  }, [finance, state.categoryRules, userId])

  const updateImportedTransaction = React.useCallback((id: string, patch: Partial<ImportedTransaction>) => {
    setState((current) => mapState({
      ...current,
      importedTransactions: current.importedTransactions.map((item) => (item.id === id ? { ...item, ...patch, updated_at: now() } : item)),
    }))
  }, [])

  const updateBatchStatus = React.useCallback((batchId: string, status: ImportBatchStatus) => {
    setState((current) => mapState({
      ...current,
      importBatches: current.importBatches.map((item) => (item.id === batchId ? { ...item, status, updated_at: now() } : item)),
    }))
  }, [])

  const approveImportedTransaction = React.useCallback((id: string) => {
    const item = state.importedTransactions.find((entry) => entry.id === id)
    if (!item) return
    const existing = finance.transactions.find((tx) => tx.id === item.matched_transaction_id)
    if (existing) {
      updateImportedTransaction(id, { status: "duplicate", matched_transaction_id: existing.id })
      return
    }
    const created: Transaction = finance.addTransaction({
      date: item.date,
      description: item.description,
      amount: item.amount,
      type: item.transaction_type,
      category_id: item.selected_category_id || item.suggested_category_id || finance.categories[0]?.id || "",
      account_id: item.selected_account_id || finance.accounts.find((account) => account.scope === item.selected_scope)?.id || finance.accounts[0]?.id || "",
      destination_account_id: undefined,
      scope: item.selected_scope,
      payment_method: item.payment_method,
      card_id: item.selected_card_id || undefined,
      notes: `Importado de ${item.batch_id}`,
    })
    updateImportedTransaction(id, {
      status: "approved",
      matched_transaction_id: created.id,
      selected_account_id: created.account_id,
      selected_category_id: created.category_id,
    })
    setState((current) => mapState({
      ...current,
      importBatches: current.importBatches.map((batch) =>
        batch.id === item.batch_id
          ? {
              ...batch,
              approved_count: batch.approved_count + 1,
              updated_at: now(),
            }
          : batch
      ),
    }))
    toast.success("Lancamento aprovado e criado no sistema.")
  }, [finance, state.importedTransactions, updateImportedTransaction])

  const approveManyImportedTransactions = React.useCallback((ids: string[]) => {
    ids.forEach((id) => {
      const item = state.importedTransactions.find((entry) => entry.id === id)
      if (item && item.status === "pending") {
        approveImportedTransaction(id)
      }
    })
  }, [approveImportedTransaction, state.importedTransactions])

  const ignoreImportedTransaction = React.useCallback((id: string) => {
    updateImportedTransaction(id, { status: "ignored" })
    toast.info("Importacao ignorada.")
  }, [updateImportedTransaction])

  const markImportedAsDuplicate = React.useCallback((id: string) => {
    updateImportedTransaction(id, { status: "duplicate" })
    toast.info("Marcado como duplicado.")
  }, [updateImportedTransaction])

  const addRule = React.useCallback((rule: Omit<CategoryRule, "id" | "created_at" | "updated_at">) => {
    const created: CategoryRule = { ...rule, id: uid("rule"), created_at: now(), updated_at: now() }
    setState((current) => mapState({ ...current, categoryRules: [created, ...current.categoryRules] }))
    toast.success("Regra criada.")
  }, [])

  const updateRule = React.useCallback((id: string, rule: Omit<CategoryRule, "id" | "created_at" | "updated_at">) => {
    setState((current) => mapState({
      ...current,
      categoryRules: current.categoryRules.map((item) => (item.id === id ? { ...item, ...rule, updated_at: now() } : item)),
    }))
    toast.success("Regra atualizada.")
  }, [])

  const toggleRule = React.useCallback((id: string, active: boolean) => {
    setState((current) => mapState({
      ...current,
      categoryRules: current.categoryRules.map((item) => (item.id === id ? { ...item, active, updated_at: now() } : item)),
    }))
  }, [])

  const addDasRecord = React.useCallback((record: Omit<DasRecord, "id" | "created_at" | "updated_at">) => {
    const created: DasRecord = { ...record, id: uid("das"), created_at: now(), updated_at: now() }
    setState((current) => mapState({ ...current, dasRecords: [created, ...current.dasRecords] }))
    toast.success("DAS registrado.")
  }, [])

  const updateDasRecord = React.useCallback((id: string, record: Omit<DasRecord, "id" | "created_at" | "updated_at">) => {
    setState((current) => mapState({
      ...current,
      dasRecords: current.dasRecords.map((item) => (item.id === id ? { ...item, ...record, updated_at: now() } : item)),
    }))
  }, [])

  const payDasRecord = React.useCallback((id: string, accountId: string) => {
    const record = state.dasRecords.find((item) => item.id === id)
    if (!record) return
    const payment = finance.addTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: `Pagamento DAS ${record.reference_month.slice(5, 7)}/${record.reference_month.slice(0, 4)}`,
      amount: record.amount,
      type: "das_payment",
      category_id: finance.categories.find((item) => item.name.toLowerCase().includes("das"))?.id || finance.categories[0]?.id || "",
      account_id: accountId,
      scope: "PJ",
      payment_method: "pix",
      notes: record.notes,
    })
    updateDasRecord(id, { ...record, status: "paid", paid_at: now(), payment_transaction_id: payment.id })
    toast.success("DAS pago e lançamento criado.")
  }, [finance, state.dasRecords, updateDasRecord])

  const addGoal = React.useCallback((goal: Omit<Goal, "id" | "created_at" | "updated_at">) => {
    const created: Goal = { ...goal, id: uid("goal"), created_at: now(), updated_at: now() }
    setState((current) => mapState({ ...current, goals: [created, ...current.goals] }))
    toast.success("Meta criada.")
  }, [])

  const updateGoal = React.useCallback((id: string, goal: Omit<Goal, "id" | "created_at" | "updated_at">) => {
    setState((current) => mapState({
      ...current,
      goals: current.goals.map((item) => (item.id === id ? { ...item, ...goal, updated_at: now() } : item)),
    }))
  }, [])

  const addToGoal = React.useCallback((id: string, amount: number) => {
    setState((current) => mapState({
      ...current,
      goals: current.goals.map((item) => (item.id === id ? { ...item, current_amount: item.current_amount + amount, updated_at: now(), status: item.current_amount + amount >= item.target_amount ? "completed" : item.status } : item)),
    }))
  }, [])

  const withdrawFromGoal = React.useCallback((id: string, amount: number) => {
    setState((current) => mapState({
      ...current,
      goals: current.goals.map((item) => (item.id === id ? { ...item, current_amount: Math.max(0, item.current_amount - amount), updated_at: now(), status: "active" } : item)),
    }))
  }, [])

  const setMeiAnnualLimit = React.useCallback((limit: number) => {
    setState((current) => mapState({
      ...current,
      userSettings: { ...current.userSettings, mei_annual_limit: limit },
    }))
    toast.success("Limite anual do MEI atualizado.")
  }, [])

  const addAttachment = React.useCallback(async ({ entity_type, entity_id, file }: { entity_type: AttachmentEntityType; entity_id: string; file: File }) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!allowed.includes(file.type)) throw new Error("Tipo de arquivo nao permitido")
    if (file.size > 10 * 1024 * 1024) throw new Error("Arquivo excede o limite permitido")
    const attachmentId = uid("att")
    const path = `${userId || "guest"}/${entity_type}/${attachmentId}-${file.name}`
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (auth.user) {
        const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: false, contentType: file.type })
        if (error) throw error
      }
    } catch (error) {
      console.error("Falha ao enviar anexo para o storage:", error)
    }
    const created: Attachment = {
      id: attachmentId,
      entity_type,
      entity_id,
      file_name: file.name,
      file_path: path,
      file_type: file.type,
      file_size: file.size,
      public_url: URL.createObjectURL(file),
      created_at: now(),
      updated_at: now(),
    }
    setState((current) => mapState({ ...current, attachments: [created, ...current.attachments] }))
    toast.success("Comprovante anexado.")
    return created
  }, [supabase, userId])

  const removeAttachment = React.useCallback((attachmentId: string) => {
    setState((current) => mapState({ ...current, attachments: current.attachments.filter((item) => item.id !== attachmentId) }))
    toast.success("Anexo removido.")
  }, [])

  const getAttachment = React.useCallback((attachmentId: string) => state.attachments.find((item) => item.id === attachmentId), [state.attachments])

  const exportBackup = React.useCallback(() => {
    downloadJson(`backup-organiza-mei-${new Date().toISOString().slice(0, 10)}.json`, createBackupPayload(finance, state))
    toast.success("Backup exportado com sucesso.")
  }, [finance, state])

  const restoreBackup = React.useCallback((json: string) => {
    const restored = restoreBackupPayload(json)
    finance.restoreFinanceState(restored.finance)
    setState(mapState(restored.level2))
    clearLevel2State(userId)
    saveLevel2State(userId, restored.level2)
    toast.success("Backup restaurado com sucesso.")
  }, [finance, userId])

  const clearImportedData = React.useCallback(() => {
    setState((current) => mapState({ ...current, importBatches: [], importedTransactions: [] }))
    toast.success("Importacoes limpas.")
  }, [])

  const value = React.useMemo(() => ({
    ...state,
    isLoading,
    registerImportBatch,
    updateImportedTransaction,
    approveImportedTransaction,
    approveManyImportedTransactions,
    ignoreImportedTransaction,
    markImportedAsDuplicate,
    updateBatchStatus,
    addRule,
    updateRule,
    toggleRule,
    addDasRecord,
    updateDasRecord,
    payDasRecord,
    addGoal,
    updateGoal,
    addToGoal,
    withdrawFromGoal,
    setMeiAnnualLimit,
    addAttachment,
    removeAttachment,
    getAttachment,
    exportBackup,
    restoreBackup,
    clearImportedData,
  }), [
    addAttachment,
    addDasRecord,
    addGoal,
    addRule,
    addToGoal,
    approveImportedTransaction,
    approveManyImportedTransactions,
    clearImportedData,
    exportBackup,
    getAttachment,
    ignoreImportedTransaction,
    isLoading,
    markImportedAsDuplicate,
    payDasRecord,
    registerImportBatch,
    removeAttachment,
    restoreBackup,
    setMeiAnnualLimit,
    state,
    toggleRule,
    updateBatchStatus,
    updateDasRecord,
    updateGoal,
    updateImportedTransaction,
    updateRule,
    withdrawFromGoal,
  ])

  return <Level2Context.Provider value={value}>{children}</Level2Context.Provider>
}

export function useLevel2() {
  const context = React.useContext(Level2Context)
  if (!context) throw new Error("useLevel2 must be used inside Level2Provider")
  return context
}
