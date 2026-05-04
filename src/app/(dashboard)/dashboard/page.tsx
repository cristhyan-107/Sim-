"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowDownIcon, ArrowRightLeft, ArrowUpIcon, Building2, CalendarClock, CreditCard, Landmark, PlusCircle, Repeat, Target, UserCircle2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { EmptyState } from "@/components/finance/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getBudgetUsage, getInvoiceTotal, getUpcomingRecurrences } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { Scope } from "@/lib/finance/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

type Range = "current" | "previous" | "3m" | "6m" | "year"
type ScopeFilter = "all" | Scope

const rangeLabels: Record<Range, string> = {
  current: "Mes atual",
  previous: "Mes anterior",
  "3m": "Ultimos 3 meses",
  "6m": "Ultimos 6 meses",
  year: "Ano atual",
}

export default function DashboardPage() {
  const finance = useFinance()
  const router = useRouter()
  const savedFilter = getSavedFilter()
  const [range, setRange] = React.useState<Range>(savedFilter.range)
  const [scope, setScope] = React.useState<ScopeFilter>(savedFilter.scope)

  React.useEffect(() => {
    window.localStorage.setItem("organiza-mei:dashboard-filter", JSON.stringify({ range, scope }))
  }, [range, scope])

  React.useEffect(() => {
    if (!finance.isLoading && finance.accounts.length === 0 && !finance.onboardingCompleted && !finance.onboardingSkipped) {
      router.replace("/onboarding")
    }
  }, [finance.accounts.length, finance.isLoading, finance.onboardingCompleted, finance.onboardingSkipped, router])

  const months = getMonths(range)
  const periodTransactions = finance.transactions.filter((tx) => months.includes(tx.date.slice(0, 7))).filter((tx) => scope === "all" || tx.scope === scope)
  const previousMonths = getPreviousMonths(months)
  const previousTransactions = finance.transactions.filter((tx) => previousMonths.includes(tx.date.slice(0, 7))).filter((tx) => scope === "all" || tx.scope === scope)
  const expenseTypes = ["expense", "invoice_payment", "das_payment", "owner_withdrawal"]
  const income = periodTransactions.filter((tx) => tx.type === "income").reduce((total, tx) => total + tx.amount, 0)
  const expense = periodTransactions.filter((tx) => expenseTypes.includes(tx.type)).reduce((total, tx) => total + tx.amount, 0)
  const prevIncome = previousTransactions.filter((tx) => tx.type === "income").reduce((total, tx) => total + tx.amount, 0)
  const prevExpense = previousTransactions.filter((tx) => expenseTypes.includes(tx.type)).reduce((total, tx) => total + tx.amount, 0)
  const openInvoices = finance.invoices.filter((invoice) => invoice.status !== "paid")
  const openInvoiceTotal = openInvoices.reduce((total, invoice) => total + getInvoiceTotal(invoice, finance.installments), 0)
  const futureInstallments = finance.installments.filter((item) => item.status === "pending").reduce((total, item) => total + item.amount, 0)
  const upcomingRecurrences = getUpcomingRecurrences(finance.recurrences)
  const ownerWithdrawals = periodTransactions.filter((item) => item.type === "owner_withdrawal").reduce((total, item) => total + item.amount, 0)
  const dasPending = finance.recurrences.filter((item) => item.description.toLowerCase().includes("das") && item.status === "active")
  const exceededBudgets = finance.budgets.filter((budget) => budget.status === "active" && getBudgetUsage(finance, budget).level === "exceeded")
  const pfBalance = finance.accounts.filter((account) => account.scope === "PF").reduce((total, account) => total + account.current_balance, 0)
  const pjBalance = finance.accounts.filter((account) => account.scope === "PJ").reduce((total, account) => total + account.current_balance, 0)
  const chartData = months.map((month) => ({
    name: `${month.slice(5, 7)}/${month.slice(2, 4)}`,
    Entradas: finance.transactions.filter((tx) => tx.date.startsWith(month) && tx.type === "income" && (scope === "all" || tx.scope === scope)).reduce((total, tx) => total + tx.amount, 0),
    Saidas: finance.transactions.filter((tx) => tx.date.startsWith(month) && tx.type !== "income" && (scope === "all" || tx.scope === scope)).reduce((total, tx) => total + tx.amount, 0),
    Parcelas: finance.installments.filter((item) => item.due_month.startsWith(month) && (scope === "all" || item.scope === scope)).reduce((total, item) => total + item.amount, 0),
  }))
  const latestTransactions = [...periodTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  if (!finance.isLoading && finance.accounts.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div><h2 className="text-3xl font-bold tracking-tight">Dashboard</h2><p className="mt-1 text-muted-foreground">Seu painel financeiro ainda precisa de dados iniciais.</p></div>
        <EmptyState icon={Landmark} title="Configure seu primeiro acesso" description="Cadastre sua conta PF principal e sua conta PJ do MEI para o dashboard mostrar saldos, alertas e fluxo financeiro." actionLabel="Comecar primeiro acesso" actionHref="/onboarding" secondaryLabel="Popular dados de exemplo" onSecondary={finance.populateExampleData} />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="mt-1 text-muted-foreground">Visualizando: {rangeLabels[range]}{scope !== "all" ? ` - ${scope}` : " - Todos"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["current", "previous", "3m", "6m", "year"] as Range[]).map((item) => <Button key={item} size="sm" variant={range === item ? "default" : "outline"} onClick={() => setRange(item)}>{rangeLabels[item]}</Button>)}
          {(["all", "PF", "PJ"] as ScopeFilter[]).map((item) => <Button key={item} size="sm" variant={scope === item ? "default" : "outline"} onClick={() => setScope(item)}>{item === "all" ? "Todos" : item}</Button>)}
          <Button size="sm" variant="ghost" onClick={() => { setRange("current"); setScope("all") }}>Limpar filtros</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Quick href="/transactions" label="Novo lancamento" icon={PlusCircle} />
        <Quick href="/installments" label="Nova compra parcelada" icon={CreditCard} />
        <Quick href="/invoices" label="Pagar fatura" icon={CalendarClock} />
        <Quick href="/recurrences" label="Nova recorrencia" icon={Repeat} />
        <Quick href="/accounts" label="Nova conta" icon={Landmark} />
        <Quick href="/cards" label="Novo cartao" icon={CreditCard} />
        <Quick href="/budgets" label="Criar orcamento" icon={Target} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SmartCard title="Saldo PF" value={formatCurrency(pfBalance)} context="Disponivel em contas PF" icon={<UserCircle2 className="size-4" />} badge="PF" />
        <SmartCard title="Saldo PJ" value={formatCurrency(pjBalance)} context="Caixa atual da empresa" icon={<Building2 className="size-4" />} badge="PJ" />
        <SmartCard title="Entradas do periodo" value={formatCurrency(income)} context="Receitas filtradas" variation={variation(income, prevIncome)} icon={<ArrowUpIcon className="size-4" />} />
        <SmartCard title="Saidas do periodo" value={formatCurrency(expense)} context="Despesas filtradas" variation={variation(expense, prevExpense)} icon={<ArrowDownIcon className="size-4" />} />
        <SmartCard title="Resultado do MEI" value={formatCurrency(income - expense)} context="Entradas menos saidas" icon={<Building2 className="size-4" />} badge={scope === "PF" ? "PF" : "PJ"} />
        <SmartCard title="Gastos pessoais" value={formatCurrency(periodTransactions.filter((tx) => tx.scope === "PF" && expenseTypes.includes(tx.type)).reduce((total, tx) => total + tx.amount, 0))} context="Saidas PF no filtro" icon={<UserCircle2 className="size-4" />} badge="PF" />
        <SmartCard title="Faturas abertas" value={`${openInvoices.length} faturas`} context={formatCurrency(openInvoiceTotal)} icon={<CreditCard className="size-4" />} />
        <SmartCard title="Parcelas futuras" value={formatCurrency(futureInstallments)} context="Total comprometido" icon={<CalendarClock className="size-4" />} />
        <SmartCard title="Proximos vencimentos" value={String(upcomingRecurrences.length)} context="Recorrencias nos proximos 30 dias" icon={<Repeat className="size-4" />} />
        <SmartCard title="Retirada do dono" value={formatCurrency(ownerWithdrawals)} context="Saidas PJ para PF" icon={<ArrowRightLeft className="size-4" />} badge="PJ" />
        <SmartCard title="DAS pendente" value={dasPending.length ? `${dasPending.length} alerta` : "Em dia"} context={dasPending[0] ? `Vence em ${formatDate(dasPending[0].next_due_date)}` : "Nenhum DAS ativo pendente"} icon={<AlertCircle className="size-4" />} />
        <SmartCard title="Orcamento estourado" value={String(exceededBudgets.length)} context="Categorias acima do limite" icon={<Target className="size-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader><CardTitle>Fluxo e compromissos</CardTitle><CardDescription>Entradas, saidas e parcelas futuras no periodo filtrado.</CardDescription></CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: 8, border: "none" }} formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="Entradas" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saidas" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Parcelas" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader><CardTitle>Ultimos lancamentos</CardTitle><CardDescription>Movimentacoes dentro do filtro atual.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            {latestTransactions.length === 0 ? <EmptyState icon={ArrowRightLeft} title="Nenhum lancamento ainda" description="Registre sua primeira entrada ou saida para acompanhar seu fluxo financeiro." actionLabel="Novo lancamento" actionHref="/transactions" /> : latestTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full border bg-muted">{tx.type === "income" ? <ArrowUpIcon className="size-4" /> : tx.type === "transfer" || tx.type === "owner_withdrawal" ? <ArrowRightLeft className="size-4" /> : <ArrowDownIcon className="size-4" />}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{tx.description}</p><p className="text-xs text-muted-foreground">{formatDate(tx.date)} - {tx.scope}</p></div>
                <div className="text-sm font-semibold">{tx.type === "income" ? "+" : tx.type === "transfer" ? "" : "-"}{formatCurrency(tx.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SmartCard({ title, value, context, icon, badge, variation: delta }: { title: string; value: string; context: string; icon: React.ReactNode; badge?: string; variation?: string }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><div className="text-muted-foreground">{icon}</div></CardHeader><CardContent className="space-y-2"><div className="text-2xl font-bold">{value}</div><div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{context}</span>{badge && <Badge variant="outline">{badge}</Badge>}</div>{delta && <div className="text-xs text-muted-foreground">{delta} vs periodo anterior</div>}</CardContent></Card>
}

function Quick({ href, label, icon: Icon }: { href: string; label: string; icon: typeof PlusCircle }) {
  return <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}><Icon className="size-4" />{label}</Link>
}

function variation(current: number, previous: number) {
  if (!previous) return "Sem comparativo"
  const delta = ((current - previous) / previous) * 100
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`
}

function getMonths(range: Range) {
  const now = new Date()
  const count = range === "3m" ? 3 : range === "6m" ? 6 : range === "year" ? now.getMonth() + 1 : 1
  const offset = range === "previous" ? 1 : 0
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - offset - (count - 1 - index), 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  })
}

function getPreviousMonths(months: string[]) {
  return months.map((month) => {
    const date = new Date(`${month}-01T00:00:00`)
    date.setMonth(date.getMonth() - months.length)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  })
}

function getSavedFilter(): { range: Range; scope: ScopeFilter } {
  if (typeof window === "undefined") return { range: "current", scope: "all" }
  try {
    const parsed = JSON.parse(window.localStorage.getItem("organiza-mei:dashboard-filter") || "{}") as { range?: Range; scope?: ScopeFilter }
    return { range: parsed.range || "current", scope: parsed.scope || "all" }
  } catch {
    return { range: "current", scope: "all" }
  }
}
