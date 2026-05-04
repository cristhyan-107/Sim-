"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, FileDown, Save, ShieldCheck } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { downloadCsv } from "@/lib/csv"
import { getMonthlyClosingSnapshot } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { formatCurrency } from "@/lib/utils"

export default function MonthlyClosingPage() {
  const finance = useFinance()
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7))
  const existing = finance.monthlyClosings.find((item) => item.month.startsWith(month))
  const [notes, setNotes] = React.useState(existing?.notes || "")
  const snapshot = getMonthlyClosingSnapshot(finance, `${month}-01`)
  const reviewed = existing?.reviewed || false
  const alerts = [
    !snapshot.dasPaid ? "DAS pendente no mes selecionado." : "",
    snapshot.openInvoices > 0 ? `${snapshot.openInvoices} fatura(s) abertas.` : "",
    snapshot.overdueInvoices > 0 ? `${snapshot.overdueInvoices} vencimento(s) em atraso.` : "",
    snapshot.exceededBudgets > 0 ? `${snapshot.exceededBudgets} orcamento(s) ultrapassado(s).` : "",
  ].filter(Boolean)

  function save(review = reviewed) {
    finance.saveMonthlyClosing({
      month: `${month}-01`,
      notes,
      reviewed: review,
      reviewed_at: review ? new Date().toISOString() : undefined,
    })
    toast.success(review ? "Mes marcado como revisado." : "Observacao salva.")
  }

  function exportClosing() {
    downloadCsv(`fechamento-${month}.csv`, [
      { indicador: "Entradas PF", valor: snapshot.pfIncome },
      { indicador: "Saidas PF", valor: snapshot.pfExpense },
      { indicador: "Resultado PF", valor: snapshot.pfResult },
      { indicador: "Entradas PJ", valor: snapshot.pjIncome },
      { indicador: "Saidas PJ", valor: snapshot.pjExpense },
      { indicador: "Resultado PJ/MEI", valor: snapshot.pjResult },
      { indicador: "Retirada do dono", valor: snapshot.ownerWithdrawals },
      { indicador: "DAS pago", valor: snapshot.dasPaid ? "sim" : "nao" },
      { indicador: "Faturas pagas", valor: snapshot.paidInvoices },
      { indicador: "Faturas abertas", valor: snapshot.openInvoices },
      { indicador: "Caixa final PF", valor: snapshot.pfEndingCash },
      { indicador: "Caixa final PJ", valor: snapshot.pjEndingCash },
      { indicador: "Parcelas futuras", valor: snapshot.futureInstallments },
      { indicador: "Observacoes", valor: notes },
    ])
  }

  const chartData = [
    { name: "PF", Entradas: snapshot.pfIncome, Saidas: snapshot.pfExpense, Resultado: snapshot.pfResult },
    { name: "PJ", Entradas: snapshot.pjIncome, Saidas: snapshot.pjExpense, Resultado: snapshot.pjResult },
  ]

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Fechamento Mensal</h2>
            {reviewed ? <Badge className="bg-emerald-600"><ShieldCheck className="mr-1 h-3 w-3" />Revisado</Badge> : <Badge variant="outline">Nao revisado</Badge>}
          </div>
          <p className="mt-1 text-muted-foreground">Conferencia mensal de PF, PJ, DAS, faturas, caixa e alertas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" type="month" value={month} onChange={(event) => {
            const nextMonth = event.target.value
            setMonth(nextMonth)
            setNotes(finance.monthlyClosings.find((item) => item.month.startsWith(nextMonth))?.notes || "")
          }} />
          <Button variant="outline" onClick={exportClosing}><FileDown className="mr-2 h-4 w-4" />Exportar CSV</Button>
          <Button onClick={() => save(true)}><CheckCircle2 className="mr-2 h-4 w-4" />Marcar revisado</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Summary title="Resultado PF" value={formatCurrency(snapshot.pfResult)} />
        <Summary title="Resultado PJ/MEI" value={formatCurrency(snapshot.pjResult)} />
        <Summary title="Retirada do dono" value={formatCurrency(snapshot.ownerWithdrawals)} />
        <Summary title="Parcelas futuras" value={formatCurrency(snapshot.futureInstallments)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Entradas x saidas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `R$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Checklist do mes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Metric label="DAS" value={snapshot.dasPaid ? "Pago" : "Pendente"} danger={!snapshot.dasPaid} />
            <Metric label="Faturas pagas" value={String(snapshot.paidInvoices)} />
            <Metric label="Faturas abertas" value={String(snapshot.openInvoices)} danger={snapshot.openInvoices > 0} />
            <Metric label="Caixa final PF" value={formatCurrency(snapshot.pfEndingCash)} />
            <Metric label="Caixa final PJ" value={formatCurrency(snapshot.pjEndingCash)} />
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader><CardTitle className="flex items-center gap-2 text-amber-600"><AlertTriangle className="h-5 w-5" />Alertas do fechamento</CardTitle></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">{alerts.map((item) => <div key={item} className="rounded-lg border bg-amber-500/10 p-3 text-sm">{item}</div>)}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Observacoes do mes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Registre decisoes, pendencias, ajustes e pontos de atencao do fechamento." />
          <Button onClick={() => save(false)}><Save className="mr-2 h-4 w-4" />Salvar observacao</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Summary({ title, value }: { title: string; value: string }) {
  return <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div className="flex items-center justify-between rounded-lg border p-3 text-sm"><span className="text-muted-foreground">{label}</span><strong className={danger ? "text-rose-600" : ""}>{value}</strong></div>
}
