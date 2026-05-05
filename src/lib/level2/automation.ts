import { FinanceState, Scope, TransactionType } from "@/lib/finance/types"
import { CategoryRule, ImportedTransaction } from "@/lib/level2/types"

export function normalizeText(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
}

export function duplicateHash(input: {
  userId: string
  date: string
  description: string
  amount: number
  accountId?: string
}) {
  return [
    input.userId,
    input.date,
    normalizeText(input.description),
    Number(input.amount).toFixed(2),
    input.accountId || "",
  ].join("|")
}

export function similarDuplicateHash(input: {
  userId: string
  date: string
  description: string
  amount: number
}) {
  return [
    input.userId,
    input.date,
    Number(input.amount).toFixed(2),
    normalizeText(input.description).slice(0, 24),
  ].join("|")
}

export function findDuplicateTransaction(
  imported: Pick<ImportedTransaction, "date" | "description" | "amount" | "selected_account_id">,
  finance: FinanceState
) {
  const targetDate = imported.date
  const targetAmount = Number(imported.amount)
  const normalized = normalizeText(imported.description)
  return finance.transactions.find((tx) => {
    const sameDate = tx.date === targetDate
    const sameAmount = Number(tx.amount) === targetAmount
    const sameDesc = normalizeText(tx.description) === normalized || normalizeText(tx.description).includes(normalized) || normalized.includes(normalizeText(tx.description))
    const sameAccount = !imported.selected_account_id || tx.account_id === imported.selected_account_id
    return sameDate && sameAmount && sameDesc && sameAccount
  })
}

export function suggestRuleMatch(
  description: string,
  rules: CategoryRule[],
  finance: FinanceState,
  scope?: Scope,
  type?: TransactionType
) {
  const normalized = normalizeText(description)
  const sorted = [...rules].filter((rule) => rule.active).sort((a, b) => b.priority - a.priority)
  for (const rule of sorted) {
    if (scope && rule.scope !== scope) continue
    if (rule.transaction_type !== "any" && type && rule.transaction_type !== type) continue
    if (normalized.includes(normalizeText(rule.keyword))) {
      const category = finance.categories.find((item) => item.id === rule.category_id)
      if (category) {
        return {
          category_id: category.id,
          scope: category.scope,
          transaction_type: category.type === "income" ? "income" : "expense",
        } as const
      }
    }
  }
  return null
}

export function guessTransactionType(description: string, amount: number): TransactionType {
  const normalized = normalizeText(description)
  if (normalized.includes("DAS")) return "das_payment"
  if (normalized.includes("FATURA") || normalized.includes("CARTAO")) return "invoice_payment"
  if (normalized.includes("RETIRADA") || normalized.includes("PRO-LABORE")) return "owner_withdrawal"
  if (amount > 0 && /RECEB|PIX RECEBIDO|TRANSFERENCIA RECEBIDA|CLIENTE/.test(normalized)) return "income"
  return amount >= 0 ? "expense" : "expense"
}

export function inferScope(description: string, finance: FinanceState): Scope {
  const normalized = normalizeText(description)
  if (normalized.includes("DAS") || normalized.includes("PJ") || normalized.includes("EMPRESA") || normalized.includes("MEI")) return "PJ"
  return finance.categories.some((item) => item.scope === "PJ" && normalized.includes(normalizeText(item.name))) ? "PJ" : "PF"
}

export function createImportTransactionDefaults(params: {
  date: string
  description: string
  amount: number
  finance: FinanceState
  rules: CategoryRule[]
}) {
  const type = guessTransactionType(params.description, params.amount)
  const scope = inferScope(params.description, params.finance)
  const rule = suggestRuleMatch(params.description, params.rules, params.finance, scope, type)
  const category = rule
    ? params.finance.categories.find((item) => item.id === rule.category_id)
    : params.finance.categories.find((item) => item.scope === scope && (type === "income" ? item.type === "income" : item.type === "expense"))

  return {
    type,
    scope: category?.scope || scope,
    category_id: category?.id || params.finance.categories.find((item) => item.scope === scope)?.id || "",
    payment_method: "pix" as const,
    account_id: params.finance.accounts.find((item) => item.scope === (category?.scope || scope))?.id || params.finance.accounts[0]?.id || "",
    card_id: params.finance.cards.find((item) => item.scope === (category?.scope || scope))?.id || "",
  }
}

export function createDefaultCategoryRules(categories: FinanceState["categories"], now = new Date()) {
  const created_at = now.toISOString()
  const updated_at = created_at
  const findCategory = (name: string, scope: Scope) => categories.find((item) => item.scope === scope && normalizeText(item.name) === normalizeText(name))?.id
  const defaults: Array<Pick<CategoryRule, "keyword" | "category_id" | "scope" | "transaction_type" | "priority">> = [
    { keyword: "IFOOD", category_id: findCategory("Alimentacao", "PF") || categories[0]?.id || "", scope: "PF", transaction_type: "expense", priority: 100 },
    { keyword: "UBER", category_id: findCategory("Transporte", "PF") || categories[0]?.id || "", scope: "PF", transaction_type: "expense", priority: 100 },
    { keyword: "99", category_id: findCategory("Transporte", "PF") || categories[0]?.id || "", scope: "PF", transaction_type: "expense", priority: 90 },
    { keyword: "MERCADO", category_id: findCategory("Alimentacao", "PF") || categories[0]?.id || "", scope: "PF", transaction_type: "expense", priority: 90 },
    { keyword: "FARMAC", category_id: findCategory("Saude", "PF") || categories[0]?.id || "", scope: "PF", transaction_type: "expense", priority: 90 },
    { keyword: "NETFLIX", category_id: findCategory("Assinaturas pessoais", "PF") || categories[0]?.id || "", scope: "PF", transaction_type: "expense", priority: 90 },
    { keyword: "SPOTIFY", category_id: findCategory("Assinaturas pessoais", "PF") || categories[0]?.id || "", scope: "PF", transaction_type: "expense", priority: 90 },
    { keyword: "META ADS", category_id: findCategory("Trafego pago", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 100 },
    { keyword: "FACEBOOK", category_id: findCategory("Trafego pago", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 95 },
    { keyword: "GOOGLE ADS", category_id: findCategory("Trafego pago", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 95 },
    { keyword: "CANVA", category_id: findCategory("Ferramentas", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 95 },
    { keyword: "CHATGPT", category_id: findCategory("Ferramentas", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 95 },
    { keyword: "OPENAI", category_id: findCategory("Ferramentas", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 90 },
    { keyword: "SUPABASE", category_id: findCategory("Ferramentas", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 90 },
    { keyword: "VERCEL", category_id: findCategory("Ferramentas", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 90 },
    { keyword: "DOMINIO", category_id: findCategory("Ferramentas", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 90 },
    { keyword: "DAS", category_id: findCategory("Impostos/DAS", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "expense", priority: 100 },
    { keyword: "PIX RECEBIDO", category_id: findCategory("Receita", "PJ") || categories[0]?.id || "", scope: "PJ", transaction_type: "income", priority: 80 },
  ]
  return defaults.map((rule) => ({
    id: crypto.randomUUID(),
    ...rule,
    active: true,
    created_at,
    updated_at,
  }))
}
