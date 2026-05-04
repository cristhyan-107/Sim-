"use client"

import * as React from "react"
import { AlertCircle, CalendarDays, CheckCircle2, Clock, CreditCard, Filter, ReceiptText, Repeat, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInvoiceTotal } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { Scope } from "@/lib/finance/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

type Status = "overdue" | "soon" | "paid" | "future"
type CalendarItem = {
  id: string
  date: string
  title: string
  amount: number
  scope: Scope
  type: "invoice" | "installment" | "recurrence" | "das"
  status: Status
  account_id?: string
  card_id?: string
  category_id?: string
}

function statusFor(date: string, paid = false): Status {
  if (paid) return "paid"
  const today = new Date()
  const due = new Date(`${date}T00:00:00`)
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000)
  if (days < 0) return "overdue"
  if (days <= 7) return "soon"
  return "future"
}

export default function CalendarPage() {
  const finance = useFinance()
  const [search, setSearch] = React.useState("")
  const [scope, setScope] = React.useState<Scope | "ALL">("ALL")
  const [account, setAccount] = React.useState("ALL")
  const [card, setCard] = React.useState("ALL")
  const [category, setCategory] = React.useState("ALL")
  const [status, setStatus] = React.useState<Status | "ALL">("ALL")
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7))

  const invoiceItems: CalendarItem[] = finance.invoices.map((invoice) => {
    const cardInfo = finance.cards.find((item) => item.id === invoice.card_id)
    return {
      id: invoice.id,
      date: invoice.due_date,
      title: `Fatura ${cardInfo?.nickname || "cartao"}`,
      amount: getInvoiceTotal(invoice, finance.installments),
      scope: cardInfo?.scope || "PF",
      type: "invoice",
      status: statusFor(invoice.due_date, invoice.status === "paid"),
      account_id: cardInfo?.account_id,
      card_id: invoice.card_id,
    }
  })

  const installmentItems: CalendarItem[] = finance.installments
    .filter((item) => item.status !== "cancelled")
    .map((item) => {
      const purchase = finance.installmentPurchases.find((purchaseItem) => purchaseItem.id === item.purchase_id)
      return {
        id: item.id,
        date: item.due_month,
        title: `Parcela ${purchase?.description || "compra"} ${item.installment_number}/${item.total_installments}`,
        amount: item.amount,
        scope: item.scope,
        type: "installment",
        status: statusFor(item.due_month, item.status === "paid"),
        card_id: item.card_id,
        category_id: item.category_id,
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
      type: item.description.toLowerCase().includes("das") ? "das" : "recurrence",
      status: statusFor(item.next_due_date),
      account_id: item.account_id,
      category_id: item.category_id,
    }))

  const items = [...invoiceItems, ...installmentItems, ...recurrenceItems]
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => scope === "ALL" || item.scope === scope)
    .filter((item) => account === "ALL" || item.account_id === account)
    .filter((item) => card === "ALL" || item.card_id === card)
    .filter((item) => category === "ALL" || item.category_id === category)
    .filter((item) => status === "ALL" || item.status === status)
    .filter((item) => !month || item.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date))

  const today = new Date()
  const in7 = new Date(); in7.setDate(today.getDate() + 7)
  const in30 = new Date(); in30.setDate(today.getDate() + 30)
  const next7 = items.filter((item) => new Date(`${item.date}T00:00:00`) <= in7 && item.status !== "paid")
  const next30 = items.filter((item) => new Date(`${item.date}T00:00:00`) <= in30 && item.status !== "paid")
  const overdue = items.filter((item) => item.status === "overdue")
  const grouped = items.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    acc[item.date] = acc[item.date] || []
    acc[item.date].push(item)
    return acc
  }, {})

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendario de Vencimentos</h2>
        <p className="mt-1 text-muted-foreground">Faturas, DAS, recorrencias, parcelas, atrasos e proximos compromissos PF/PJ.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Summary title="Vencidos" value={String(overdue.length)} tone="danger" />
        <Summary title="Proximos 7 dias" value={String(next7.length)} tone="warning" />
        <Summary title="Proximos 30 dias" value={String(next30.length)} />
        <Summary title="PF / PJ" value={`${items.filter((i) => i.scope === "PF").length} / ${items.filter((i) => i.scope === "PJ").length}`} />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Buscar vencimento..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            <FilterSelect value={scope} onChange={setScope} items={[["ALL", "PF e PJ"], ["PF", "PF"], ["PJ", "PJ"]]} />
            <FilterSelect value={account} onChange={setAccount} items={[["ALL", "Todas contas"], ...finance.accounts.map((item) => [item.id, item.name] as [string, string])]} />
            <FilterSelect value={card} onChange={setCard} items={[["ALL", "Todos cartoes"], ...finance.cards.map((item) => [item.id, item.nickname] as [string, string])]} />
            <FilterSelect value={category} onChange={setCategory} items={[["ALL", "Todas categorias"], ...finance.categories.map((item) => [item.id, item.name] as [string, string])]} />
            <FilterSelect value={status} onChange={setStatus} items={[["ALL", "Todos status"], ["overdue", "Vencido"], ["soon", "Em breve"], ["paid", "Pago"], ["future", "Futuro"]]} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(grouped).map(([date, group]) => (
            <div key={date} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b p-3">
                <div className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4" />{formatDate(date)}</div>
                <Badge variant="outline">{group.length} item(ns)</Badge>
              </div>
              <div className="grid gap-3 p-3 lg:grid-cols-2">
                {group.map((item) => <CalendarRow key={`${item.type}-${item.id}`} item={item} />)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function CalendarRow({ item }: { item: CalendarItem }) {
  const Icon = item.type === "invoice" ? CreditCard : item.type === "installment" ? ReceiptText : item.type === "das" ? AlertCircle : Repeat
  return (
    <div className={cn("rounded-lg border p-3", item.status === "overdue" && "border-rose-500/60 bg-rose-500/10", item.status === "soon" && "border-amber-500/60 bg-amber-500/10", item.status === "paid" && "border-emerald-500/60 bg-emerald-500/10", item.status === "future" && "bg-muted/40")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><strong>{item.title}</strong><ScopeBadge scope={item.scope} /><StatusBadge status={item.status} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{item.type === "das" ? "Obrigacao MEI" : item.type === "invoice" ? "Fatura de cartao" : item.type === "installment" ? "Parcela futura" : "Conta recorrente"}</p>
        </div>
        <strong>{formatCurrency(item.amount)}</strong>
      </div>
    </div>
  )
}

function Summary({ title, value, tone }: { title: string; value: string; tone?: "danger" | "warning" }) {
  return <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className={cn("text-2xl font-bold", tone === "danger" && "text-rose-600", tone === "warning" && "text-amber-600")}>{value}</CardContent></Card>
}

function FilterSelect<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: [string, string][] }) {
  return <Select value={value} onValueChange={(next) => onChange(next as T)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{items.map(([itemValue, label]) => <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>)}</SelectContent></Select>
}

function ScopeBadge({ scope }: { scope: Scope }) {
  return <Badge variant="outline" className={scope === "PF" ? "border-blue-500 text-blue-600" : "border-emerald-500 text-emerald-600"}>{scope}</Badge>
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    overdue: ["Vencido", "border-rose-500 text-rose-600", AlertCircle],
    soon: ["Em breve", "border-amber-500 text-amber-600", Clock],
    paid: ["Pago", "border-emerald-500 text-emerald-600", CheckCircle2],
    future: ["Futuro", "border-blue-500 text-blue-600", CalendarDays],
  } as const
  const [label, className, Icon] = map[status]
  return <Badge variant="outline" className={className}><Icon className="mr-1 h-3 w-3" />{label}</Badge>
}
