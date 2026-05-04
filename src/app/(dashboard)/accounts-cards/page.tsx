"use client"

import Link from "next/link"
import { CreditCard, Landmark, ShieldAlert, WalletCards } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/finance/empty-state"
import { getInvoiceTotal } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

export default function AccountsCardsPage() {
  const finance = useFinance()
  const activeAccounts = finance.accounts.filter((item) => item.status !== "closed")
  const activeCards = finance.cards.filter((item) => item.status === "active")
  const pfTotal = finance.accounts.filter((item) => item.scope === "PF").reduce((total, item) => total + item.current_balance, 0)
  const pjTotal = finance.accounts.filter((item) => item.scope === "PJ").reduce((total, item) => total + item.current_balance, 0)
  const month = new Date().toISOString().slice(0, 7)
  const monthInvoices = finance.invoices.filter((item) => item.invoice_month.startsWith(month))
  const nextInvoice = [...finance.invoices].filter((item) => item.status !== "paid").sort((a, b) => a.due_date.localeCompare(b.due_date))[0]

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contas & Cartoes</h2>
          <p className="mt-1 text-muted-foreground">Visao consolidada da sua estrutura financeira PF e PJ.</p>
        </div>
        <div className="flex gap-2"><Link className={cn(buttonVariants(), "h-9")} href="/accounts">Nova conta</Link><Link className={cn(buttonVariants({ variant: "outline" }), "h-9")} href="/cards">Novo cartao</Link></div>
      </div>

      <Alert>
        <ShieldAlert className="size-4" />
        <AlertDescription>Cartoes sao usados apenas como apelidos de controle financeiro. Nunca informe numero completo, CVV, validade, senha, token ou foto.</AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric title="Total PF" value={formatCurrency(pfTotal)} icon={Landmark} />
        <Metric title="Total PJ" value={formatCurrency(pjTotal)} icon={Landmark} />
        <Metric title="Cartoes ativos" value={String(activeCards.length)} icon={CreditCard} />
        <Metric title="Faturas do mes" value={formatCurrency(monthInvoices.reduce((total, item) => total + getInvoiceTotal(item, finance.installments), 0))} icon={WalletCards} />
        <Metric title="Proximo vencimento" value={nextInvoice ? formatDate(nextInvoice.due_date) : "Sem fatura"} icon={CreditCard} />
      </div>

      {activeAccounts.length === 0 && activeCards.length === 0 ? (
        <EmptyState icon={WalletCards} title="Nenhuma conta ou cartao cadastrado" description="Comece cadastrando sua conta PF principal e sua conta PJ do MEI para liberar uma visao consolidada." actionLabel="Cadastrar conta" actionHref="/accounts" secondaryLabel="Primeiro acesso" secondaryHref="/onboarding" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Contas ativas e secundarias</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {finance.accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div><div className="font-medium">{account.name}</div><div className="text-sm text-muted-foreground">{account.bank} - {account.role}</div></div>
                  <div className="text-right"><Badge variant="outline">{account.scope}</Badge><div className="mt-1 font-semibold">{formatCurrency(account.current_balance)}</div><Link className="text-xs text-muted-foreground underline-offset-4 hover:underline" href="/accounts">Editar</Link></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Cartoes por apelido</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {finance.cards.map((card) => {
                const invoice = finance.invoices.find((item) => item.card_id === card.id && item.invoice_month.startsWith(month))
                const used = invoice ? getInvoiceTotal(invoice, finance.installments) : 0
                return (
                  <div key={card.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div><div className="font-medium">{card.nickname}</div><div className="text-sm text-muted-foreground">{card.bank} - vence dia {card.due_day}</div></div>
                    <div className="text-right"><Badge variant={card.status === "active" ? "outline" : "secondary"}>{card.scope}</Badge><div className="mt-1 font-semibold">{formatCurrency(used)} / {formatCurrency(card.credit_limit)}</div><Link className="text-xs text-muted-foreground underline-offset-4 hover:underline" href="/cards">Editar cartao</Link></div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Landmark }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>
}
