"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, BadgeDollarSign, Building2, CalendarClock, Wallet } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useFinance } from "@/lib/finance/store"
import { useLevel2 } from "@/components/providers/level2-provider"
import { formatCurrency, formatDate } from "@/lib/utils"
import { EmptyState } from "@/components/finance/empty-state"

export default function MeiPage() {
  const finance = useFinance()
  const level2 = useLevel2()
  const currentYear = new Date().getFullYear().toString()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const pjIncomeMonth = finance.transactions.filter((tx) => tx.scope === "PJ" && tx.type === "income" && tx.date.startsWith(currentMonth)).reduce((sum, tx) => sum + tx.amount, 0)
  const pjIncomeYear = finance.transactions.filter((tx) => tx.scope === "PJ" && tx.type === "income" && tx.date.startsWith(currentYear)).reduce((sum, tx) => sum + tx.amount, 0)
  const pjExpensesMonth = finance.transactions.filter((tx) => tx.scope === "PJ" && tx.type !== "income" && tx.date.startsWith(currentMonth)).reduce((sum, tx) => sum + tx.amount, 0)
  const ownerWithdrawals = finance.transactions.filter((tx) => tx.type === "owner_withdrawal" && tx.date.startsWith(currentMonth)).reduce((sum, tx) => sum + tx.amount, 0)
  const dasPending = level2.dasRecords.filter((record) => record.status !== "paid")
  const annualLimit = level2.userSettings.mei_annual_limit
  const annualUsed = Math.min(annualLimit, pjIncomeYear)
  const annualRemaining = Math.max(0, annualLimit - pjIncomeYear)

  const monthlyChart = Array.from({ length: 12 }, (_, index) => {
    const month = `${currentYear}-${String(index + 1).padStart(2, "0")}`
    return {
      month: month.slice(5, 7),
      faturamento: finance.transactions.filter((tx) => tx.scope === "PJ" && tx.type === "income" && tx.date.startsWith(month)).reduce((sum, tx) => sum + tx.amount, 0),
      despesas: finance.transactions.filter((tx) => tx.scope === "PJ" && tx.type !== "income" && tx.date.startsWith(month)).reduce((sum, tx) => sum + tx.amount, 0),
    }
  })

  if (!finance.transactions.length && !level2.dasRecords.length) {
    return (
      <div className="flex-1 p-4 pt-6 md:p-8">
        <EmptyState
          icon={BadgeDollarSign}
          title="Painel MEI sem dados"
          description="Cadastre entradas, saidas e DAS para enxergar faturamento, limite anual e resultado do negocio."
          actionLabel="Novo lancamento"
          actionHref="/transactions"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Painel MEI</h2>
        <p className="mt-1 text-muted-foreground">Visao focada na empresa: faturamento, limite anual, DAS e resultado PJ.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="Faturamento do mes" value={formatCurrency(pjIncomeMonth)} icon={<Building2 className="h-4 w-4" />} />
        <Stat title="Faturamento anual" value={formatCurrency(pjIncomeYear)} icon={<BadgeDollarSign className="h-4 w-4" />} />
        <Stat title="Caixa PJ" value={formatCurrency(finance.accounts.filter((account) => account.scope === "PJ").reduce((sum, account) => sum + account.current_balance, 0))} icon={<Wallet className="h-4 w-4" />} />
        <Stat title="DAS pendente" value={String(dasPending.length)} icon={<CalendarClock className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Evolucao mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="faturamento" fill="var(--chart-2)" />
                <Bar dataKey="despesas" fill="var(--chart-4)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Limite anual do MEI</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(annualUsed / annualLimit) * 100} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(annualUsed)}</span>
              <span>{formatCurrency(annualLimit)}</span>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">Restante</div>
              <div>{formatCurrency(annualRemaining)}</div>
            </div>
            {annualUsed / annualLimit > 0.8 && <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />Atenção ao limite anual do MEI.</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Resumo operacional</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Summary label="Despesas PJ do mes" value={pjExpensesMonth} />
          <Summary label="Retiradas do dono" value={ownerWithdrawals} />
          <Summary label="Resultado PJ" value={pjIncomeMonth - pjExpensesMonth} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Proximas obrigacoes</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {level2.dasRecords.slice(0, 3).map((record) => (
            <div key={record.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <strong>DAS {record.reference_month}</strong>
                <Badge variant="outline">{record.status}</Badge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Vence {formatDate(record.due_date)} - {formatCurrency(record.amount)}</div>
            </div>
          ))}
          {level2.dasRecords.length === 0 && <div className="text-sm text-muted-foreground">Cadastre um DAS para ver proximas obrigacoes aqui.</div>}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold">{formatCurrency(value)}</div></div>
}
