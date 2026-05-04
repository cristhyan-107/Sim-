"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { CalendarDays, CreditCard, Edit, Filter, PackageCheck, PlusCircle, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { getCommittedByMonth } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { InstallmentPurchase, PurchaseStatus, Scope } from "@/lib/finance/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

const schema = z.object({
  description: z.string().min(3, "Informe a descricao"),
  total_amount: z.number().positive("O valor total deve ser maior que zero"),
  installments_count: z.number().int().min(2, "Minimo de 2 parcelas").max(72, "Maximo de 72 parcelas"),
  card_id: z.string().min(1, "Selecione o cartao"),
  category_id: z.string().min(1, "Selecione a categoria"),
  scope: z.enum(["PF", "PJ"]),
  purchase_date: z.string().min(1, "Informe a data da compra"),
  first_invoice_month: z.string().min(1, "Informe o mes da primeira fatura"),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function defaultValues(): FormValues {
  const month = new Date().toISOString().slice(0, 7)
  return {
    description: "",
    total_amount: 0,
    installments_count: 2,
    card_id: "",
    category_id: "",
    scope: "PF",
    purchase_date: new Date().toISOString().slice(0, 10),
    first_invoice_month: `${month}-01`,
    notes: "",
  }
}

function toFormValues(purchase: InstallmentPurchase): FormValues {
  return {
    description: purchase.description,
    total_amount: purchase.total_amount,
    installments_count: purchase.installments_count,
    card_id: purchase.card_id,
    category_id: purchase.category_id,
    scope: purchase.scope,
    purchase_date: purchase.purchase_date,
    first_invoice_month: purchase.first_invoice_month,
    notes: purchase.notes || "",
  }
}

export default function InstallmentsPage() {
  const finance = useFinance()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<InstallmentPurchase | null>(null)
  const [search, setSearch] = React.useState("")
  const [scope, setScope] = React.useState<Scope | "ALL">("ALL")
  const [card, setCard] = React.useState("ALL")
  const [category, setCategory] = React.useState("ALL")
  const [month, setMonth] = React.useState("ALL")
  const [status, setStatus] = React.useState<PurchaseStatus | "ALL">("ALL")
  const [saving, setSaving] = React.useState(false)

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaultValues() })
  const selectedScope = useWatch({ control: form.control, name: "scope" })
  const totalAmount = useWatch({ control: form.control, name: "total_amount" })
  const count = useWatch({ control: form.control, name: "installments_count" })
  const installmentAmount = totalAmount > 0 && count > 0 ? totalAmount / count : 0

  const purchases = finance.installmentPurchases
    .filter((item) => item.description.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => scope === "ALL" || item.scope === scope)
    .filter((item) => card === "ALL" || item.card_id === card)
    .filter((item) => category === "ALL" || item.category_id === category)
    .filter((item) => status === "ALL" || item.status === status)
    .filter((item) => month === "ALL" || finance.installments.some((inst) => inst.purchase_id === item.id && inst.due_month.startsWith(month)))

  const totalCommitted = finance.installments.filter((item) => item.status === "pending").reduce((total, item) => total + item.amount, 0)
  const pendingCount = finance.installments.filter((item) => item.status === "pending").length
  const monthlyImpact = Object.entries(getCommittedByMonth(finance.installments)).sort(([a], [b]) => a.localeCompare(b)).slice(0, 6)

  function openNew() {
    setEditing(null)
    form.reset(defaultValues())
    setOpen(true)
  }

  function openEdit(purchase: InstallmentPurchase) {
    const hasPaid = finance.installments.some((item) => item.purchase_id === purchase.id && item.status === "paid")
    if (hasPaid) {
      toast.error("Compras com parcela paga nao podem ser editadas.")
      return
    }
    setEditing(purchase)
    form.reset(toFormValues(purchase))
    setOpen(true)
  }

  function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const payload = { ...values, first_invoice_month: values.first_invoice_month.slice(0, 7) + "-01", notes: values.notes || undefined }
      if (editing) {
        finance.updatePurchase(editing.id, payload)
        toast.success("Compra parcelada atualizada e parcelas regeneradas.")
      } else {
        finance.addPurchase(payload)
        toast.success(`${values.installments_count} parcelas de ${formatCurrency(values.total_amount / values.installments_count)} geradas.`)
      }
      setOpen(false)
      form.reset(defaultValues())
    } catch {
      toast.error("Nao foi possivel salvar a compra parcelada.")
    } finally {
      setSaving(false)
    }
  }

  function cancelPurchase(purchase: InstallmentPurchase) {
    if (!window.confirm(`Cancelar a compra parcelada "${purchase.description}"?`)) return
    finance.cancelPurchase(purchase.id)
    toast.success("Compra cancelada e parcelas marcadas como canceladas.")
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compras Parceladas</h2>
          <p className="mt-1 text-muted-foreground">Gere parcelas futuras, acompanhe progresso e veja o impacto mensal.</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button onClick={openNew} />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Compra Parcelada
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-auto sm:max-w-[540px]">
            <SheetHeader>
              <SheetTitle>{editing ? "Editar compra parcelada" : "Nova compra parcelada"}</SheetTitle>
              <SheetDescription>O sistema cria as parcelas mes a mes a partir da primeira fatura.</SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descricao</FormLabel><FormControl><Input placeholder="Ex: Compra de R$ 1.200 em 6x" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="total_amount" render={({ field }) => (
                    <FormItem><FormLabel>Valor total</FormLabel><FormControl><Input type="number" step="0.01" value={field.value} onChange={(event) => field.onChange(event.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="installments_count" render={({ field }) => (
                    <FormItem><FormLabel>Parcelas</FormLabel><FormControl><Input type="number" min="2" max="72" value={field.value} onChange={(event) => field.onChange(event.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <div className="flex items-center justify-between"><span>Valor da parcela</span><strong>{formatCurrency(installmentAmount || 0)}</strong></div>
                  {installmentAmount > 0 && <p className="mt-1 text-xs text-muted-foreground">Exemplo: 1/{count} {formatCurrency(installmentAmount)} ate {count}/{count} {formatCurrency(installmentAmount)}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="scope" render={({ field }) => (
                    <FormItem><FormLabel>Escopo</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="card_id" render={({ field }) => (
                    <FormItem><FormLabel>Cartao</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{finance.cards.filter((item) => item.scope === selectedScope).map((item) => <SelectItem key={item.id} value={item.id}>{item.nickname}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem><FormLabel>Categoria</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{finance.categories.filter((item) => item.scope === selectedScope).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="purchase_date" render={({ field }) => (
                    <FormItem><FormLabel>Data da compra</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="first_invoice_month" render={({ field }) => (
                    <FormItem><FormLabel>Primeira fatura</FormLabel><FormControl><Input type="month" value={field.value.slice(0, 7)} onChange={(event) => field.onChange(`${event.target.value}-01`)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Observacao</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <SheetFooter className="px-0"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button></SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Parcelamentos ativos" value={String(finance.installmentPurchases.filter((item) => item.status === "active").length)} icon={<PackageCheck className="h-4 w-4" />} />
        <SummaryCard title="Total comprometido" value={formatCurrency(totalCommitted)} icon={<CalendarDays className="h-4 w-4" />} />
        <SummaryCard title="Parcelas pendentes" value={String(pendingCount)} icon={<CreditCard className="h-4 w-4" />} />
        <Card className="bg-primary text-primary-foreground"><CardHeader><CardTitle className="text-sm">Proximos meses</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">{monthlyImpact.slice(0, 3).map(([m, v]) => <div key={m} className="flex justify-between"><span>{m}</span><strong>{formatCurrency(v)}</strong></div>)}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Buscar compra..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <FilterSelect value={card} onChange={setCard} items={[["ALL", "Todos os cartoes"], ...finance.cards.map((item) => [item.id, item.nickname] as [string, string])]} />
            <FilterSelect value={category} onChange={setCategory} items={[["ALL", "Todas categorias"], ...finance.categories.map((item) => [item.id, item.name] as [string, string])]} />
            <Input type="month" value={month === "ALL" ? "" : month} onChange={(event) => setMonth(event.target.value || "ALL")} />
            <FilterSelect value={scope} onChange={setScope} items={[["ALL", "PF e PJ"], ["PF", "PF"], ["PJ", "PJ"]]} />
            <FilterSelect value={status} onChange={setStatus} items={[["ALL", "Todos status"], ["active", "Ativa"], ["cancelled", "Cancelada"], ["finished", "Finalizada"]]} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {purchases.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Nenhuma compra parcelada encontrada.</div>
          ) : purchases.map((purchase) => {
            const cardInfo = finance.cards.find((item) => item.id === purchase.card_id)
            const installments = finance.installments.filter((item) => item.purchase_id === purchase.id).sort((a, b) => a.installment_number - b.installment_number)
            const paid = installments.filter((item) => item.status === "paid").length
            const pending = installments.filter((item) => item.status === "pending")
            const progress = (paid / purchase.installments_count) * 100
            const next = pending[0]
            const remaining = pending.reduce((total, item) => total + item.amount, 0)
            return (
              <div key={purchase.id} className={cn("rounded-lg border bg-card p-4", purchase.status === "cancelled" && "opacity-60")}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{purchase.description}</h3>
                      <ScopeBadge scope={purchase.scope} />
                      <Badge variant="outline">{purchase.status === "active" ? "Ativa" : purchase.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{cardInfo?.nickname} - compra em {formatDate(purchase.purchase_date)}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <div className="text-xl font-bold">{formatCurrency(purchase.total_amount)}</div>
                    <div className="text-sm text-muted-foreground">{purchase.installments_count}x de {formatCurrency(purchase.installment_amount)}</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{paid} pagas, {pending.length} faltando</span><span>Falta pagar {formatCurrency(remaining)}</span></div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {installments.map((item) => <Badge key={item.id} variant="outline" className={item.status === "paid" ? "border-emerald-500 text-emerald-600" : item.status === "cancelled" ? "border-rose-500 text-rose-600" : ""}>{item.installment_number}/{item.total_installments} {formatCurrency(item.amount)}</Badge>)}
                  </div>
                  <div className="flex flex-col gap-3 pt-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-muted-foreground">Proxima parcela: {next ? `${next.installment_number}/${next.total_installments} em ${next.due_month.slice(0, 7)}` : "nenhuma pendente"}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(purchase)}><Edit className="mr-2 h-4 w-4" />Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => cancelPurchase(purchase)}><Trash2 className="mr-2 h-4 w-4" />Cancelar</Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
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
