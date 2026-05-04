"use client"

import * as React from "react"
import { CalendarClock, CheckCircle2, CreditCard, Filter, ReceiptText } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getInvoiceTotal } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { Invoice, InvoiceStatus, Scope } from "@/lib/finance/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

const statusLabels: Record<InvoiceStatus, string> = {
  open: "Aberta",
  future: "Futura",
  paid: "Paga",
}

export default function InvoicesPage() {
  const finance = useFinance()
  const [card, setCard] = React.useState("ALL")
  const [month, setMonth] = React.useState("ALL")
  const [status, setStatus] = React.useState<InvoiceStatus | "ALL">("ALL")
  const [scope, setScope] = React.useState<Scope | "ALL">("ALL")
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null)
  const [paymentInvoice, setPaymentInvoice] = React.useState<Invoice | null>(null)
  const [paymentAccount, setPaymentAccount] = React.useState("")

  const invoices = finance.invoices
    .filter((invoice) => card === "ALL" || invoice.card_id === card)
    .filter((invoice) => month === "ALL" || invoice.invoice_month.startsWith(month))
    .filter((invoice) => status === "ALL" || invoice.status === status)
    .filter((invoice) => {
      const invoiceCard = finance.cards.find((item) => item.id === invoice.card_id)
      return scope === "ALL" || invoiceCard?.scope === scope
    })
    .sort((a, b) => a.invoice_month.localeCompare(b.invoice_month))

  const openTotal = finance.invoices.filter((item) => item.status === "open").reduce((total, invoice) => total + getInvoiceTotal(invoice, finance.installments), 0)
  const futureTotal = finance.invoices.filter((item) => item.status === "future").reduce((total, invoice) => total + getInvoiceTotal(invoice, finance.installments), 0)
  const paidTotal = finance.invoices.filter((item) => item.status === "paid").reduce((total, invoice) => total + getInvoiceTotal(invoice, finance.installments), 0)

  function openPayment(invoice: Invoice) {
    const invoiceCard = finance.cards.find((item) => item.id === invoice.card_id)
    setPaymentAccount(finance.accounts.find((item) => item.scope === invoiceCard?.scope)?.id || "")
    setPaymentInvoice(invoice)
  }

  function payInvoice() {
    if (!paymentInvoice || !paymentAccount) {
      toast.error("Escolha a conta de pagamento.")
      return
    }
    finance.payInvoice(paymentInvoice, paymentAccount)
    toast.success("Fatura paga, parcelas baixadas e lancamento criado.")
    setPaymentInvoice(null)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Faturas</h2>
        <p className="mt-1 text-muted-foreground">Faturas agrupadas por cartao e mes, com pagamento integrado aos lancamentos.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Faturas abertas" value={formatCurrency(openTotal)} icon={<ReceiptText className="h-4 w-4 text-rose-500" />} />
        <SummaryCard title="Faturas futuras" value={formatCurrency(futureTotal)} icon={<CalendarClock className="h-4 w-4 text-amber-500" />} />
        <SummaryCard title="Faturas pagas" value={formatCurrency(paidTotal)} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
          <div className="grid gap-3 md:grid-cols-4">
            <FilterSelect value={card} onChange={setCard} items={[["ALL", "Todos os cartoes"], ...finance.cards.map((item) => [item.id, item.nickname] as [string, string])]} />
            <input className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm" type="month" value={month === "ALL" ? "" : month} onChange={(event) => setMonth(event.target.value || "ALL")} />
            <FilterSelect value={status} onChange={setStatus} items={[["ALL", "Todos status"], ["open", "Aberta"], ["future", "Futura"], ["paid", "Paga"]]} />
            <FilterSelect value={scope} onChange={setScope} items={[["ALL", "PF e PJ"], ["PF", "PF"], ["PJ", "PJ"]]} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {invoices.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground lg:col-span-2">Nenhuma fatura encontrada.</div>
          ) : invoices.map((invoice) => {
            const invoiceCard = finance.cards.find((item) => item.id === invoice.card_id)
            const account = finance.accounts.find((item) => item.id === invoice.paid_from_account_id)
            const total = getInvoiceTotal(invoice, finance.installments)
            const items = finance.installments.filter((item) => item.card_id === invoice.card_id && item.due_month === invoice.invoice_month && item.status !== "cancelled")
            return (
              <div key={invoice.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{invoiceCard?.nickname}</h3>
                      {invoiceCard && <ScopeBadge scope={invoiceCard.scope} />}
                      <StatusBadge status={invoice.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{invoiceCard?.bank} - {invoice.invoice_month.slice(5, 7)}/{invoice.invoice_month.slice(0, 4)} - vence {formatDate(invoice.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{formatCurrency(total)}</div>
                    <div className="text-xs text-muted-foreground">{items.length} item(ns)</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 rounded-lg bg-muted/40 p-3">
                  {items.slice(0, 3).map((item) => {
                    const purchase = finance.installmentPurchases.find((purchaseItem) => purchaseItem.id === item.purchase_id)
                    return <div key={item.id} className="flex justify-between text-sm"><span>{purchase?.description} {item.installment_number}/{item.total_installments}</span><strong>{formatCurrency(item.amount)}</strong></div>
                  })}
                  {items.length > 3 && <div className="text-xs text-muted-foreground">+ {items.length - 3} item(ns)</div>}
                </div>
                {invoice.status === "paid" && (
                  <p className="mt-3 text-sm text-muted-foreground">Paga por {account?.name || "conta removida"} em {invoice.paid_at ? formatDate(invoice.paid_at) : "-"}</p>
                )}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedInvoice(invoice)}>Detalhar itens</Button>
                  {invoice.status !== "paid" && <Button onClick={() => openPayment(invoice)}>Marcar como paga</Button>}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Dialog open={!!selectedInvoice} onOpenChange={(next) => !next && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Itens da fatura</DialogTitle>
            <DialogDescription>Compras e parcelas agrupadas no cartao e mes selecionados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedInvoice && finance.installments.filter((item) => item.card_id === selectedInvoice.card_id && item.due_month === selectedInvoice.invoice_month && item.status !== "cancelled").map((item) => {
              const purchase = finance.installmentPurchases.find((purchaseItem) => purchaseItem.id === item.purchase_id)
              return <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{purchase?.description} - parcela {item.installment_number}/{item.total_installments}</span><strong>{formatCurrency(item.amount)}</strong></div>
            })}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSelectedInvoice(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentInvoice} onOpenChange={(next) => !next && setPaymentInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar fatura como paga</DialogTitle>
            <DialogDescription>O pagamento vai gerar um lancamento de saida na conta escolhida.</DialogDescription>
          </DialogHeader>
          <Select value={paymentAccount} onValueChange={(value) => setPaymentAccount(value || "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Conta de pagamento" /></SelectTrigger>
            <SelectContent>
              {finance.accounts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} ({item.scope})</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentInvoice(null)}>Cancelar</Button>
            <Button onClick={payInvoice}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm">{icon}{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
}

function FilterSelect<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: [string, string][] }) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>{items.map(([itemValue, label]) => <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>)}</SelectContent>
    </Select>
  )
}

function ScopeBadge({ scope }: { scope: Scope }) {
  return <Badge variant="outline" className={scope === "PF" ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950" : "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950"}>{scope}</Badge>
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant="outline" className={cn(status === "paid" && "border-emerald-500 text-emerald-600", status === "future" && "border-amber-500 text-amber-600", status === "open" && "border-rose-500 text-rose-600")}>{statusLabels[status]}</Badge>
}
