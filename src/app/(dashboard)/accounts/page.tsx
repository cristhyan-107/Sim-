"use client"

import * as React from "react"
import { CheckCircle2, Landmark, MoreHorizontal, PlusCircle, Search, Wallet, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFinance } from "@/lib/finance/store"
import { Account, Scope } from "@/lib/finance/types"
import { formatCurrency } from "@/lib/utils"

export default function AccountsPage() {
  const finance = useFinance()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Account | null>(null)
  const [form, setForm] = React.useState({ name: "", bank: "", scope: "PF" as Scope, role: "", initial_balance: 0 })

  const filteredAccounts = finance.accounts.filter((acc) =>
    (acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || acc.bank.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  function openNew() {
    setEditing(null)
    setForm({ name: "", bank: "", scope: "PF", role: "", initial_balance: 0 })
    setOpen(true)
  }

  function openEdit(account: Account) {
    setEditing(account)
    setForm({ name: account.name, bank: account.bank, scope: account.scope, role: account.role, initial_balance: account.initial_balance })
    setOpen(true)
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (!form.name || !form.bank) {
      toast.error("Preencha nome e banco.")
      return
    }
    if (editing) {
      finance.updateAccount(editing.id, form)
      toast.success("Conta atualizada.")
    } else {
      finance.addAccount(form)
      toast.success("Conta criada.")
    }
    setOpen(false)
  }

  function closeAccount(account: Account) {
    if (finance.transactions.some((tx) => tx.account_id === account.id || tx.destination_account_id === account.id)) {
      finance.inactivateAccount(account.id)
      toast.success("Conta com movimentacoes foi encerrada, nao excluida.")
      return
    }
    finance.inactivateAccount(account.id)
    toast.success("Conta inativada.")
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contas Bancarias</h2>
          <p className="mt-1 text-muted-foreground">Gerencie contas PF e PJ persistidas no Supabase quando autenticado.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openNew} />}><PlusCircle className="mr-2 h-4 w-4" />Nova Conta</DialogTrigger>
          <DialogContent>
            <form onSubmit={save}>
              <DialogHeader><DialogTitle>{editing ? "Editar conta" : "Nova conta"}</DialogTitle><DialogDescription>Conta bancaria para calcular saldos e movimentacoes.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Banco"><Input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Escopo"><Select value={form.scope} onValueChange={(value) => setForm({ ...form, scope: value as Scope })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent></Select></Field>
                  <Field label="Saldo inicial"><Input type="number" step="0.01" value={form.initial_balance} onChange={(e) => setForm({ ...form, initial_balance: e.target.valueAsNumber || 0 })} /></Field>
                </div>
                <Field label="Papel"><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Conta principal" /></Field>
              </div>
              <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary title="Total em contas" value={formatCurrency(finance.accounts.reduce((acc, curr) => acc + curr.current_balance, 0))} icon={<Wallet className="h-4 w-4" />} />
        <Summary title="Saldo PF" value={formatCurrency(finance.accounts.filter((a) => a.scope === "PF").reduce((acc, curr) => acc + curr.current_balance, 0))} icon={<Landmark className="h-4 w-4 text-blue-500" />} />
        <Summary title="Saldo PJ" value={formatCurrency(finance.accounts.filter((a) => a.scope === "PJ").reduce((acc, curr) => acc + curr.current_balance, 0))} icon={<Landmark className="h-4 w-4 text-emerald-500" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Contas</CardTitle>
          <CardDescription>Todas as contas ativas, secundarias e encerradas.</CardDescription>
          <div className="relative mt-4 max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Buscar contas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Banco</TableHead><TableHead>Escopo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}<div className="text-xs font-normal text-muted-foreground">{account.role}</div></TableCell>
                    <TableCell>{account.bank}</TableCell>
                    <TableCell><ScopeBadge scope={account.scope} /></TableCell>
                    <TableCell>{account.status === "active" ? <span className="flex items-center text-emerald-500"><CheckCircle2 className="mr-1 h-4 w-4" />Ativa</span> : <span className="flex items-center text-muted-foreground"><XCircle className="mr-1 h-4 w-4" />Encerrada</span>}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(account.current_balance)}</TableCell>
                    <TableCell><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Acoes</DropdownMenuLabel><DropdownMenuItem onClick={() => openEdit(account)}>Editar</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={() => closeAccount(account)}>Inativar/encerrar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>
}

function Summary({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm">{icon}{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
}

function ScopeBadge({ scope }: { scope: Scope }) {
  return <Badge variant="outline" className={scope === "PF" ? "border-blue-500 text-blue-600" : "border-emerald-500 text-emerald-600"}>{scope}</Badge>
}
