"use client"

import { AlertCircle, ArrowDownIcon, ArrowRightLeft, ArrowUpIcon, Building2, CalendarClock, CreditCard, Repeat, UserCircle2 } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCommittedByMonth, getFinanceSummary, getInvoiceTotal, getUpcomingRecurrences } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function DashboardPage() {
  const finance = useFinance()
  const summary = getFinanceSummary(finance)
  const committedByMonth = getCommittedByMonth(finance.installments)
  const chartData = Object.entries(committedByMonth).slice(0, 6).map(([month, amount]) => ({
    name: month.slice(5, 7) + "/" + month.slice(2, 4),
    Parcelas: amount,
    Saidas: finance.transactions.filter((tx) => tx.date.startsWith(month) && tx.type !== "income").reduce((total, tx) => total + tx.amount, 0),
    Entradas: finance.transactions.filter((tx) => tx.date.startsWith(month) && tx.type === "income").reduce((total, tx) => total + tx.amount, 0),
  }))
  const latestTransactions = [...finance.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const openInvoices = finance.invoices.filter((invoice) => invoice.status !== "paid").slice(0, 4)
  const upcomingRecurrences = getUpcomingRecurrences(finance.recurrences).slice(0, 4)
  const alerts = [
    ...openInvoices.slice(0, 2).map((invoice) => {
      const card = finance.cards.find((item) => item.id === invoice.card_id)
      return { scope: card?.scope || "PF", message: `Fatura ${card?.nickname || "cartao"} vence em ${formatDate(invoice.due_date)}.` }
    }),
    ...upcomingRecurrences.filter((item) => item.description.toLowerCase().includes("das")).map((item) => ({ scope: "PJ" as const, message: `DAS previsto para ${formatDate(item.next_due_date)}.` })),
  ]

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-muted-foreground">Visao consolidada do motor financeiro local.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Saldo Total PF" value={formatCurrency(summary.pf.total_balance)} icon={<UserCircle2 className="h-4 w-4 text-blue-500" />} />
        <SummaryCard title="Saldo Total PJ" value={formatCurrency(summary.pj.total_balance)} icon={<Building2 className="h-4 w-4 text-emerald-500" />} />
        <SummaryCard title="Entradas do Mes" value={formatCurrency(summary.pf.income_month + summary.pj.income_month)} icon={<ArrowUpIcon className="h-4 w-4 text-emerald-500" />} />
        <SummaryCard title="Saidas do Mes" value={formatCurrency(summary.pf.expense_month + summary.pj.expense_month)} icon={<ArrowDownIcon className="h-4 w-4 text-rose-500" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Faturas abertas/futuras" value={formatCurrency(openInvoices.reduce((total, invoice) => total + getInvoiceTotal(invoice, finance.installments), 0))} icon={<CreditCard className="h-4 w-4 text-amber-500" />} />
        <SummaryCard title="Parcelas futuras" value={formatCurrency(summary.futureInstallments)} icon={<CalendarClock className="h-4 w-4 text-rose-500" />} />
        <SummaryCard title="Recorrencias proximas" value={String(upcomingRecurrences.length)} icon={<Repeat className="h-4 w-4 text-primary" />} />
        <SummaryCard title="Retiradas do dono" value={formatCurrency(summary.pj.owner_withdrawals)} icon={<ArrowRightLeft className="h-4 w-4 text-amber-500" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Fluxo e compromissos</CardTitle>
            <CardDescription>Entradas, saidas e parcelas futuras por mes.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={chartData.length ? chartData : [{ name: "Atual", Entradas: summary.pj.income_month + summary.pf.income_month, Saidas: summary.pj.expense_month + summary.pf.expense_month, Parcelas: summary.futureInstallments }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: 8, border: "none" }} formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Parcelas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Ultimos lancamentos</CardTitle>
            <CardDescription>Movimentacoes atualizadas pelo motor financeiro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {latestTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted">
                  {tx.type === "income" ? <ArrowUpIcon className="h-4 w-4 text-emerald-500" /> : tx.type === "transfer" || tx.type === "owner_withdrawal" ? <ArrowRightLeft className="h-4 w-4 text-amber-500" /> : <ArrowDownIcon className="h-4 w-4 text-rose-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)} - {tx.scope}</p>
                </div>
                <div className="text-sm font-semibold">{tx.type === "income" ? "+" : tx.type === "transfer" ? "" : "-"}{formatCurrency(tx.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoPanel title="Faturas abertas e futuras" items={openInvoices.map((invoice) => {
          const card = finance.cards.find((item) => item.id === invoice.card_id)
          return { label: `${card?.nickname} ${invoice.invoice_month.slice(0, 7)}`, value: formatCurrency(getInvoiceTotal(invoice, finance.installments)), scope: card?.scope || "PF" }
        })} />
        <InfoPanel title="Recorrencias proximas" items={upcomingRecurrences.map((item) => ({ label: `${item.description} - ${formatDate(item.next_due_date)}`, value: formatCurrency(item.amount), scope: item.scope }))} />
        <InfoPanel title="Alertas" items={alerts.map((item) => ({ label: item.message, value: "", scope: item.scope }))} alert />
      </div>
    </div>
  )
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  )
}

function InfoPanel({ title, items, alert }: { title: string; items: { label: string; value: string; scope: "PF" | "PJ" }[]; alert?: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2">{alert && <AlertCircle className="h-5 w-5 text-amber-500" />}{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Nada pendente.</p> : items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span>{item.label}</span>
            <div className="flex items-center gap-2">
              {item.value && <strong>{item.value}</strong>}
              <Badge variant="outline" className={item.scope === "PF" ? "border-blue-500 text-blue-600" : "border-emerald-500 text-emerald-600"}>{item.scope}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
