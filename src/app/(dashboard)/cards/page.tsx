"use client"

import * as React from "react"
import { CreditCard, PlusCircle, Search, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/finance/empty-state"
import { useFinance } from "@/lib/finance/store"
import { CardAccount, Scope } from "@/lib/finance/types"
import { formatCurrency } from "@/lib/utils"

export default function CardsPage() {
  const finance = useFinance()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CardAccount | null>(null)
  const [form, setForm] = React.useState({
    nickname: "",
    bank: "",
    account_id: "",
    scope: "PF" as Scope,
    credit_limit: 0,
    last_four_digits: "",
    closing_day: 1,
    due_day: 10,
  })

  const filteredCards = finance.cards.filter((card) =>
    card.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || card.bank.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function openNew() {
    setEditing(null)
    setForm({ nickname: "", bank: "", account_id: finance.accounts[0]?.id || "", scope: "PF", credit_limit: 0, last_four_digits: "", closing_day: 1, due_day: 10 })
    setOpen(true)
  }

  function openEdit(card: CardAccount) {
    setEditing(card)
    setForm({
      nickname: card.nickname,
      bank: card.bank,
      account_id: card.account_id,
      scope: card.scope,
      credit_limit: card.credit_limit,
      last_four_digits: card.last_four_digits || "",
      closing_day: card.closing_day,
      due_day: card.due_day,
    })
    setOpen(true)
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (!form.nickname || !form.bank || !form.account_id) {
      toast.error("Preencha apelido, banco e conta de pagamento.")
      return
    }
    if (editing) {
      finance.updateCard(editing.id, { ...form, last_four_digits: form.last_four_digits || undefined })
      toast.success("Cartao atualizado.")
    } else {
      finance.addCard({ ...form, last_four_digits: form.last_four_digits || undefined })
      toast.success("Cartao criado.")
    }
    setOpen(false)
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cartoes de Credito</h2>
          <p className="mt-1 text-muted-foreground">Apenas apelidos para controle financeiro. Nenhum dado sensivel e armazenado.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openNew} />}><PlusCircle className="mr-2 h-4 w-4" />Novo Cartao</DialogTrigger>
          <DialogContent>
            <form onSubmit={save}>
              <DialogHeader><DialogTitle>{editing ? "Editar cartao" : "Novo cartao"}</DialogTitle><DialogDescription>Cadastre somente dados de organizacao. Nao informe dados sensiveis.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <Alert variant="destructive" className="bg-destructive/10 text-destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Aviso de Seguranca</AlertTitle>
                  <AlertDescription className="text-xs">Nunca informe numero completo, CVV, validade, senha, login bancario, token ou foto do cartao.</AlertDescription>
                </Alert>
                <Field label="Apelido"><Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-4"><Field label="Banco"><Input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} /></Field><Field label="Ultimos 4 digitos"><Input maxLength={4} value={form.last_four_digits} onChange={(e) => setForm({ ...form, last_four_digits: e.target.value.replace(/\D/g, "") })} /></Field></div>
                <div className="grid grid-cols-2 gap-4"><Field label="Escopo"><Select value={form.scope} onValueChange={(value) => setForm({ ...form, scope: value as Scope })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent></Select></Field><Field label="Conta"><Select value={form.account_id} onValueChange={(value) => setForm({ ...form, account_id: value || "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{finance.accounts.filter((acc) => acc.scope === form.scope).map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent></Select></Field></div>
                <div className="grid grid-cols-2 gap-4"><Field label="Fechamento"><Input type="number" min="1" max="31" value={form.closing_day} onChange={(e) => setForm({ ...form, closing_day: e.target.valueAsNumber || 1 })} /></Field><Field label="Vencimento"><Input type="number" min="1" max="31" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.valueAsNumber || 1 })} /></Field></div>
                <Field label="Limite"><Input type="number" step="0.01" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.valueAsNumber || 0 })} /></Field>
              </div>
              <DialogFooter><Button>Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Buscar cartoes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredCards.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState icon={CreditCard} title="Nenhum cartao cadastrado" description="Cadastre apenas um apelido do cartao. Nunca informe numero completo, CVV ou validade." actionLabel="Cadastrar cartao" onAction={openNew} />
          </div>
        ) : filteredCards.map((card) => (
          <Card key={card.id} className="relative overflow-hidden">
            <div className={`absolute left-0 top-0 h-full w-1 ${card.scope === "PF" ? "bg-blue-500" : "bg-emerald-500"}`} />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{card.nickname}</CardTitle><CardDescription>{card.bank}</CardDescription></div>
                <Badge variant="outline">{card.scope}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Final identificador" value={card.last_four_digits || "****"} />
              <Info label="Fechamento" value={`Dia ${card.closing_day}`} />
              <Info label="Vencimento" value={`Dia ${card.due_day}`} />
              <Info label="Limite" value={formatCurrency(card.credit_limit || 0)} />
            </CardContent>
            <CardFooter className="gap-2 border-t bg-muted/50"><Button variant="outline" className="w-full" onClick={() => openEdit(card)}>Editar</Button><Button variant="destructive" className="w-full" onClick={() => { finance.inactivateCard(card.id); toast.success("Cartao inativado.") }}>Inativar</Button></CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
}
