"use client"

import * as React from "react"
import { ArrowDownCircle, ArrowRightLeft, ArrowUpCircle, Edit, MoreHorizontal, PlusCircle, Search, Tags, Trash2 } from "lucide-react"
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
import { EmptyState } from "@/components/finance/empty-state"
import { useFinance } from "@/lib/finance/store"
import { Category, Scope } from "@/lib/finance/types"

type CategoryType = "income" | "expense" | "transfer"

export default function CategoriesPage() {
  const finance = useFinance()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [scopeFilter, setScopeFilter] = React.useState<Scope | "ALL">("ALL")
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Category | null>(null)
  const [form, setForm] = React.useState({ name: "", scope: "PF" as Scope, type: "expense" as CategoryType })

  const filteredCategories = finance.categories
    .filter((cat) => cat.status !== "inactive")
    .filter((cat) => cat.name.toLowerCase().includes(searchTerm.toLowerCase()) && (scopeFilter === "ALL" || cat.scope === scopeFilter))

  function openNew() {
    setEditing(null)
    setForm({ name: "", scope: "PF", type: "expense" })
    setOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setForm({ name: category.name, scope: category.scope, type: category.type })
    setOpen(true)
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (!form.name) {
      toast.error("Informe o nome da categoria.")
      return
    }
    if (editing) {
      finance.updateCategory(editing.id, form)
      toast.success("Categoria atualizada.")
    } else {
      finance.addCategory(form)
      toast.success("Categoria criada.")
    }
    setOpen(false)
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categorias</h2>
          <p className="mt-1 text-muted-foreground">Classifique receitas, despesas e transferencias PF/PJ.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openNew} />}><PlusCircle className="mr-2 h-4 w-4" />Nova Categoria</DialogTrigger>
          <DialogContent>
            <form onSubmit={save}>
              <DialogHeader><DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle><DialogDescription>Categoria usada em lancamentos, orcamentos e relatorios.</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Escopo"><Select value={form.scope} onValueChange={(value) => setForm({ ...form, scope: value as Scope })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent></Select></Field>
                  <Field label="Tipo"><Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as CategoryType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Entrada</SelectItem><SelectItem value="expense">Saida</SelectItem><SelectItem value="transfer">Transferencia</SelectItem></SelectContent></Select></Field>
                </div>
              </div>
              <DialogFooter><Button>Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tags className="h-5 w-5" />Todas as Categorias</CardTitle>
          <CardDescription>Lista real do usuario autenticado, com fallback mock em desenvolvimento.</CardDescription>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Buscar categorias..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Select value={scopeFilter} onValueChange={(value) => setScopeFilter((value || "ALL") as Scope | "ALL")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent></Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <EmptyState icon={Tags} title="Nenhuma categoria cadastrada" description="Crie categorias PF e PJ para classificar entradas, saidas e transferencias." actionLabel="Cadastrar categoria" onAction={openNew} secondaryLabel="Popular dados de exemplo" onSecondary={finance.populateExampleData} />
          ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Escopo</TableHead><TableHead>Natureza</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell><Badge variant="outline">{category.scope}</Badge></TableCell>
                    <TableCell><div className="flex items-center">{typeIcon(category.type)}{typeLabel(category.type)}</div></TableCell>
                    <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Acoes</DropdownMenuLabel><DropdownMenuItem onClick={() => openEdit(category)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={() => { finance.inactivateCategory(category.id); toast.success("Categoria inativada.") }}><Trash2 className="mr-2 h-4 w-4" />Inativar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>
}

function typeIcon(type: string) {
  if (type === "income") return <ArrowUpCircle className="mr-2 h-4 w-4 text-emerald-500" />
  if (type === "transfer") return <ArrowRightLeft className="mr-2 h-4 w-4 text-amber-500" />
  return <ArrowDownCircle className="mr-2 h-4 w-4 text-rose-500" />
}

function typeLabel(type: string) {
  if (type === "income") return "Entrada"
  if (type === "transfer") return "Transferencia"
  return "Saida"
}
