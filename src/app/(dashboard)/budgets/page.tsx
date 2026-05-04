"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { AlertTriangle, Edit, Filter, PlusCircle, Target, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { downloadCsv, datedName, csvRows } from "@/lib/csv"
import { getBudgetUsage } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { Budget, Scope } from "@/lib/finance/types"
import { cn, formatCurrency } from "@/lib/utils"

const schema = z.object({
  category_id: z.string().min(1, "Selecione a categoria"),
  scope: z.enum(["PF", "PJ"]),
  month: z.string().min(1, "Informe o mes"),
  limit_amount: z.number().positive("Informe limite maior que zero"),
  alert_percentage: z.number().min(1).max(100),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function defaults(): FormValues {
  return {
    category_id: "",
    scope: "PF",
    month: `${new Date().toISOString().slice(0, 7)}-01`,
    limit_amount: 0,
    alert_percentage: 80,
    notes: "",
  }
}

function toForm(budget: Budget): FormValues {
  return {
    category_id: budget.category_id,
    scope: budget.scope,
    month: budget.month,
    limit_amount: budget.limit_amount,
    alert_percentage: budget.alert_percentage,
    notes: budget.notes || "",
  }
}

export default function BudgetsPage() {
  const finance = useFinance()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Budget | null>(null)
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7))
  const [scope, setScope] = React.useState<Scope | "ALL">("ALL")
  const [category, setCategory] = React.useState("ALL")
  const [saving, setSaving] = React.useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults() })
  const selectedScope = useWatch({ control: form.control, name: "scope" })

  const budgets = finance.budgets
    .filter((item) => item.status === "active")
    .filter((item) => item.month.startsWith(month))
    .filter((item) => scope === "ALL" || item.scope === scope)
    .filter((item) => category === "ALL" || item.category_id === category)

  const usage = budgets.map((budget) => ({ budget, usage: getBudgetUsage(finance, budget) }))
  const totalLimit = usage.reduce((total, item) => total + item.budget.limit_amount, 0)
  const totalSpent = usage.reduce((total, item) => total + item.usage.spent, 0)
  const exceeded = usage.filter((item) => item.usage.level === "exceeded").length

  function openNew() {
    setEditing(null)
    form.reset(defaults())
    setOpen(true)
  }

  function openEdit(budget: Budget) {
    setEditing(budget)
    form.reset(toForm(budget))
    setOpen(true)
  }

  function submit(values: FormValues) {
    setSaving(true)
    try {
      const payload = { ...values, notes: values.notes || undefined, month: values.month.slice(0, 7) + "-01" }
      if (editing) {
        finance.updateBudget(editing.id, payload)
        toast.success("Orcamento atualizado.")
      } else {
        finance.addBudget(payload)
        toast.success("Orcamento criado.")
      }
      setOpen(false)
    } catch {
      toast.error("Nao foi possivel salvar o orcamento.")
    } finally {
      setSaving(false)
    }
  }

  function remove(id: string) {
    if (!window.confirm("Inativar este orcamento?")) return
    finance.deleteBudget(id)
    toast.success("Orcamento inativado.")
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orcamento</h2>
          <p className="mt-1 text-muted-foreground">Limites por categoria com realizado, alertas e excedentes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadCsv(datedName("orcamentos", month), csvRows.budgets(finance))}>Exportar CSV</Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button onClick={openNew} />}><PlusCircle className="mr-2 h-4 w-4" />Novo Orcamento</SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-[520px]">
              <SheetHeader><SheetTitle>{editing ? "Editar orcamento" : "Novo orcamento"}</SheetTitle><SheetDescription>Defina um limite mensal e percentual de alerta.</SheetDescription></SheetHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)} className="space-y-4 px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="scope" render={({ field }) => <FormItem><FormLabel>Escopo</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="month" render={({ field }) => <FormItem><FormLabel>Mes</FormLabel><FormControl><Input type="month" value={field.value.slice(0, 7)} onChange={(event) => field.onChange(`${event.target.value}-01`)} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <FormField control={form.control} name="category_id" render={({ field }) => <FormItem><FormLabel>Categoria</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{finance.categories.filter((item) => item.scope === selectedScope && item.type === "expense").map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="limit_amount" render={({ field }) => <FormItem><FormLabel>Limite mensal</FormLabel><FormControl><Input type="number" step="0.01" value={field.value} onChange={(event) => field.onChange(event.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="alert_percentage" render={({ field }) => <FormItem><FormLabel>Alerta %</FormLabel><FormControl><Input type="number" min="1" max="100" value={field.value} onChange={(event) => field.onChange(event.target.valueAsNumber || 80)} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>Observacao</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>} />
                  <SheetFooter className="px-0"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button></SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Summary title="Limite total" value={formatCurrency(totalLimit)} />
        <Summary title="Realizado" value={formatCurrency(totalSpent)} />
        <Summary title="Restante" value={formatCurrency(Math.max(totalLimit - totalSpent, 0))} />
        <Summary title="Ultrapassados" value={String(exceeded)} danger={exceeded > 0} />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
          <div className="grid gap-3 md:grid-cols-3">
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            <FilterSelect value={scope} onChange={setScope} items={[["ALL", "PF e PJ"], ["PF", "PF"], ["PJ", "PJ"]]} />
            <FilterSelect value={category} onChange={setCategory} items={[["ALL", "Todas categorias"], ...finance.categories.map((item) => [item.id, item.name] as [string, string])]} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {usage.map(({ budget, usage }) => {
            const categoryInfo = finance.categories.find((item) => item.id === budget.category_id)
            return (
              <div key={budget.id} className={cn("rounded-lg border bg-card p-4", usage.level === "exceeded" && "border-rose-500/60")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Target className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{categoryInfo?.name}</h3>
                      <ScopeBadge scope={budget.scope} />
                      <LevelBadge level={usage.level} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Alerta em {budget.alert_percentage}% - limite {formatCurrency(budget.limit_amount)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon-sm" onClick={() => openEdit(budget)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon-sm" onClick={() => remove(budget.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span>{formatCurrency(usage.spent)} usado</span><strong>{usage.percent.toFixed(0)}%</strong></div>
                  <Progress value={Math.min(usage.percent, 100)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>Restante: {formatCurrency(usage.remaining)}</span><span>{usage.exceeded > 0 ? `Excedido: ${formatCurrency(usage.exceeded)}` : "Dentro do limite"}</span></div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function Summary({ title, value, danger }: { title: string; value: string; danger?: boolean }) {
  return <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className={cn("text-2xl font-bold", danger && "text-rose-600")}>{value}</CardContent></Card>
}

function FilterSelect<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: [string, string][] }) {
  return <Select value={value} onValueChange={(next) => onChange(next as T)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{items.map(([itemValue, label]) => <SelectItem key={itemValue} value={itemValue}>{label}</SelectItem>)}</SelectContent></Select>
}

function ScopeBadge({ scope }: { scope: Scope }) {
  return <Badge variant="outline" className={scope === "PF" ? "border-blue-500 text-blue-600" : "border-emerald-500 text-emerald-600"}>{scope}</Badge>
}

function LevelBadge({ level }: { level: string }) {
  const label = level === "exceeded" ? "Ultrapassado" : level === "critical" ? "90%+" : level === "warning" ? "Alerta" : "Saudavel"
  return <Badge variant="outline" className={cn(level === "exceeded" && "border-rose-500 text-rose-600", level === "critical" && "border-orange-500 text-orange-600", level === "warning" && "border-amber-500 text-amber-600", level === "ok" && "border-emerald-500 text-emerald-600")}>{level !== "ok" && <AlertTriangle className="mr-1 h-3 w-3" />}{label}</Badge>
}
