"use client"

import { CalendarDays, CreditCard, ReceiptText, Repeat } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInvoiceTotal } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { Scope } from "@/lib/finance/types"
import { formatCurrency, formatDate } from "@/lib/utils"

type CalendarItem = {
  id: string
  date: string
  title: string
  amount: number
  scope: Scope
  type: "invoice" | "installment" | "recurrence"
}

export default function CalendarPage() {
  const finance = useFinance()
  const invoiceItems: CalendarItem[] = finance.invoices
    .filter((invoice) => invoice.status !== "paid")
    .map((invoice) => {
      const card = finance.cards.find((item) => item.id === invoice.card_id)
      return {
        id: invoice.id,
        date: invoice.due_date,
        title: `Fatura ${card?.nickname || "cartao"}`,
        amount: getInvoiceTotal(invoice, finance.installments),
        scope: card?.scope || "PF",
        type: "invoice",
      }
    })

  const installmentItems: CalendarItem[] = finance.installments
    .filter((item) => item.status === "pending")
    .slice(0, 12)
    .map((item) => {
      const purchase = finance.installmentPurchases.find((purchaseItem) => purchaseItem.id === item.purchase_id)
      return {
        id: item.id,
        date: item.due_month,
        title: `${purchase?.description || "Parcela"} ${item.installment_number}/${item.total_installments}`,
        amount: item.amount,
        scope: item.scope,
        type: "installment",
      }
    })

  const recurrenceItems: CalendarItem[] = finance.recurrences
    .filter((item) => item.status === "active")
    .map((item) => ({
      id: item.id,
      date: item.next_due_date,
      title: item.description,
      amount: item.amount,
      scope: item.scope,
      type: "recurrence",
    }))

  const items = [...invoiceItems, ...installmentItems, ...recurrenceItems]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 24)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendario Financeiro</h2>
        <p className="mt-1 text-muted-foreground">Proximos vencimentos de faturas, parcelas e recorrencias.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary title="Faturas pendentes" value={String(invoiceItems.length)} icon={<CreditCard className="h-4 w-4 text-amber-500" />} />
        <Summary title="Parcelas futuras" value={String(installmentItems.length)} icon={<ReceiptText className="h-4 w-4 text-rose-500" />} />
        <Summary title="Recorrencias ativas" value={String(recurrenceItems.length)} icon={<Repeat className="h-4 w-4 text-emerald-500" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Linha do tempo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{item.type === "invoice" ? "Fatura" : item.type === "installment" ? "Parcela" : "Recorrencia"}</Badge>
                  <ScopeBadge scope={item.scope} />
                  <span className="text-sm text-muted-foreground">{formatDate(item.date)}</span>
                </div>
                <h3 className="mt-2 font-semibold">{item.title}</h3>
              </div>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Summary({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm">{icon}{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
}

function ScopeBadge({ scope }: { scope: Scope }) {
  return <Badge variant="outline" className={scope === "PF" ? "border-blue-500 text-blue-600" : "border-emerald-500 text-emerald-600"}>{scope}</Badge>
}
