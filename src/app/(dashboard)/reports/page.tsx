"use client"

import * as React from "react"
import { BarChart3, FileDown, Filter, PieChart as PieChartIcon, TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { downloadCsv } from "@/lib/csv"
import { getBudgetUsage, getCommittedByMonth, getInvoiceTotal, getMonthlySeries } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { Scope } from "@/lib/finance/types"
import { formatCurrency, formatDate } from "@/lib/utils"

const colors = ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6", "#14b8a6", "#64748b"]

function monthRange(start: string, end: string) {
  const months: string[] = []
  const date = new Date(`${start}-01T00:00:00`)
  const last = new Date(`${end}-01T00:00:00`)
  while (date <= last) {
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`)
    date.setMonth(date.getMonth() + 1)
  }
  return months
}

export default function ReportsPage() {
  const finance = useFinance()
  const current = new Date().toISOString().slice(0, 7)
  const [start, setStart] = React.useState(`${new Date().getFullYear()}-01`)
  const [end, setEnd] = React.useState(current)
  const [scope, setScope] = React.useState<Scope | "ALL">("ALL")
  const [account, setAccount] = React.useState("ALL")
  const [card, setCard] = React.useState("ALL")
  const [category, setCategory] = React.useState("ALL")
  const months = monthRange(start, end)

  const transactions = finance.transactions
    .filter((item) => item.date.slice(0, 7) >= start && item.date.slice(0, 7) <= end)
    .filter((item) => scope === "ALL" || item.scope === scope)
    .filter((item) => account === "ALL" || item.account_id === account || item.destination_account_id === account)
    .filter((item) => category === "ALL" || item.category_id === category)

  const monthly = getMonthlySeries({ ...finance, transactions }, months)
  const categoryRows = finance.categories
    .map((cat) => ({
      name: cat.name,
      value: transactions.filter((tx) => tx.category_id === cat.id && tx.type !== "income").reduce((total, tx) => total + tx.amount, 0),
      scope: cat.scope,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  const invoicesByCard = finance.cards
    .filter((item) => card === "ALL" || item.id === card)
    .map((cardItem) => ({
      name: cardItem.nickname,
      valor: finance.invoices.filter((invoice) => invoice.card_id === cardItem.id).reduce((total, invoice) => total + getInvoiceTotal(invoice, finance.installments), 0),
    }))

  const committed = Object.entries(getCommittedByMonth(finance.installments)).map(([month, value]) => ({ month, value }))
  const budgetRows = finance.budgets.filter((item) => item.status === "active").map((budget) => {
    const usage = getBudgetUsage(finance, budget)
    return {
      categoria: finance.categories.find((cat) => cat.id === budget.category_id)?.name || "",
      orcado: budget.limit_amount,
      realizado: usage.spent,
      escopo: budget.scope,
    }
  })
  const upcoming = finance.recurrences.filter((item) => item.status === "active").map((item) => ({ descricao: item.description, data: item.next_due_date, valor: item.amount, escopo: item.scope }))

  function exportReport() {
    downloadCsv(`relatorio-${scope.toLowerCase()}-${start}-${end}.csv`, [
      ...transactions.map((item) => ({ tipo: "lancamento", data: item.date, descricao: item.description, valor: item.amount, escopo: item.scope })),
      ...budgetRows.map((item) => ({ tipo: "orcamento", data: end, descricao: item.categoria, valor: item.realizado, escopo: item.escopo })),
      ...upcoming.map((item) => ({ tipo: "vencimento", data: item.data, descricao: item.descricao, valor: item.valor, escopo: item.escopo })),
    ])
  }

  const income = transactions.filter((item) => item.type === "income").reduce((total, item) => total + item.amount, 0)
  const expense = transactions.filter((item) => item.type !== "income").reduce((total, item) => total + item.amount, 0)

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatorios</h2>
          <p className="mt-1 text-muted-foreground">Analises de fluxo, categorias, faturas, orcamento, MEI e compromissos futuros.</p>
        </div>
        <Button onClick={exportReport}><FileDown className="mr-2 h-4 w-4" />Exportar relatorio CSV</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Input type="month" value={start} onChange={(event) => setStart(event.target.value)} />
          <Input type="month" value={end} onChange={(event) => setEnd(event.target.value)} />
          <FilterSelect value={scope} onChange={setScope} items={[["ALL", "PF e PJ"], ["PF", "PF"], ["PJ", "PJ"]]} />
          <FilterSelect value={account} onChange={setAccount} items={[["ALL", "Todas contas"], ...finance.accounts.map((item) => [item.id, item.name] as [string, string])]} />
          <FilterSelect value={card} onChange={setCard} items={[["ALL", "Todos cartoes"], ...finance.cards.map((item) => [item.id, item.nickname] as [string, string])]} />
          <FilterSelect value={category} onChange={setCategory} items={[["ALL", "Todas categorias"], ...finance.categories.map((item) => [item.id, item.name] as [string, string])]} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Summary title="Entradas" value={formatCurrency(income)} />
        <Summary title="Saidas" value={formatCurrency(expense)} />
        <Summary title="Resultado" value={formatCurrency(income - expense)} />
        <Summary title="Compromisso futuro" value={formatCurrency(committed.reduce((total, item) => total + item.value, 0))} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="1. Entradas x saidas por mes" icon={<BarChart3 className="h-5 w-5" />}>
          <ResponsiveContainer width="100%" height={300}><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} /><XAxis dataKey="month" /><YAxis tickFormatter={(v) => `R$${v}`} /><Tooltip formatter={(v) => formatCurrency(Number(v))} /><Legend /><Bar dataKey="Entradas" fill="#10b981" /><Bar dataKey="Saidas" fill="#f43f5e" /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="2. Gastos por categoria" icon={<PieChartIcon className="h-5 w-5" />}>
          <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={categoryRows} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105}>{categoryRows.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(v) => formatCurrency(Number(v))} /><Legend /></PieChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="3. Faturas por cartao" icon={<BarChart3 className="h-5 w-5" />}>
          <ResponsiveContainer width="100%" height={280}><BarChart data={invoicesByCard}><XAxis dataKey="name" /><YAxis tickFormatter={(v) => `R$${v}`} /><Tooltip formatter={(v) => formatCurrency(Number(v))} /><Bar dataKey="valor" fill="#f59e0b" /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="4. Parcelas futuras e comprometimento" icon={<TrendingUp className="h-5 w-5" />}>
          <ResponsiveContainer width="100%" height={280}><AreaChart data={committed}><XAxis dataKey="month" /><YAxis tickFormatter={(v) => `R$${v}`} /><Tooltip formatter={(v) => formatCurrency(Number(v))} /><Area dataKey="value" fill="#3b82f6" stroke="#2563eb" /></AreaChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="5, 6, 10 e 11. Resultado MEI, retiradas e saldos" icon={<TrendingUp className="h-5 w-5" />}>
          <ResponsiveContainer width="100%" height={300}><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} /><XAxis dataKey="month" /><YAxis tickFormatter={(v) => `R$${v}`} /><Tooltip formatter={(v) => formatCurrency(Number(v))} /><Legend /><Line dataKey="ResultadoMEI" stroke="#10b981" /><Line dataKey="Retiradas" stroke="#f59e0b" /><Line dataKey="SaldoPF" stroke="#3b82f6" /><Line dataKey="SaldoPJ" stroke="#14b8a6" /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="7, 8 e 14. Distribuicao PF x PJ" icon={<BarChart3 className="h-5 w-5" />}>
          <ResponsiveContainer width="100%" height={300}><BarChart data={monthly}><XAxis dataKey="month" /><YAxis tickFormatter={(v) => `R$${v}`} /><Tooltip formatter={(v) => formatCurrency(Number(v))} /><Legend /><Bar dataKey="PF" stackId="a" fill="#3b82f6" /><Bar dataKey="PJ" stackId="a" fill="#10b981" /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TableCard title="9. Orcamento x realizado" rows={budgetRows.map((item) => [`${item.categoria} (${item.escopo})`, formatCurrency(item.orcado), formatCurrency(item.realizado)])} headers={["Categoria", "Orcado", "Realizado"]} />
        <TableCard title="12. Proximos vencimentos" rows={upcoming.map((item) => [formatDate(item.data), item.descricao, formatCurrency(item.valor), item.escopo])} headers={["Data", "Descricao", "Valor", "Escopo"]} />
      </div>
    </div>
  )
}

function Summary({ title, value }: { title: string; value: string }) {
  return <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>
}

function TableCard({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{headers.map((item) => <th key={item} className="border-b p-2 text-left text-muted-foreground">{item}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b p-2">{cellIndex === row.length - 1 && ["PF", "PJ"].includes(cell) ? <Badge variant="outline">{cell}</Badge> : cell}</td>)}</tr>)}</tbody></table></div></CardContent></Card>
}

function FilterSelect<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: [string, string][] }) {
  return <Select value={value} onValueChange={(next) => onChange(next as T)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{items.map(([itemValue, label]) => <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>)}</SelectContent></Select>
}
