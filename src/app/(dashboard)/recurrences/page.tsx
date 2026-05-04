"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { Edit, Filter, PauseCircle, PlayCircle, PlusCircle, Repeat, StopCircle, Wand2 } from "lucide-react"
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
import { useFinance } from "@/lib/finance/store"
import { PaymentMethod, Recurrence, RecurrenceFrequency, RecurrenceStatus, Scope } from "@/lib/finance/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

const schema = z.object({
  description: z.string().min(3, "Informe a descricao"),
  amount: z.number().positive("Informe um valor maior que zero"),
  type: z.enum(["income", "expense"]),
  category_id: z.string().min(1, "Selecione a categoria"),
  account_id: z.string().min(1, "Selecione a conta"),
  scope: z.enum(["PF", "PJ"]),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  start_date: z.string().min(1, "Informe a data inicial"),
  end_date: z.string().optional(),
  next_due_date: z.string().min(1, "Informe o proximo vencimento"),
  status: z.enum(["active", "paused", "finished"]),
  payment_method: z.enum(["pix", "debit", "credit_card", "cash", "bank_slip", "transfer", "other"]),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.description.toLowerCase().includes("das") && data.scope !== "PJ") {
    ctx.addIssue({ code: "custom", path: ["scope"], message: "DAS deve ser PJ" })
  }
})

type FormValues = z.infer<typeof schema>

const frequencyLabels: Record<RecurrenceFrequency, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
}

const statusLabels: Record<RecurrenceStatus, string> = {
  active: "Ativa",
  paused: "Pausada",
  finished: "Finalizada",
}

const paymentLabels: Record<PaymentMethod, string> = {
  pix: "PIX",
  debit: "Debito",
  credit_card: "Cartao de credito",
  cash: "Dinheiro",
  bank_slip: "Boleto",
  transfer: "Transferencia",
  other: "Outro",
}

function defaultValues(): FormValues {
  return {
    description: "",
    amount: 0,
    type: "expense",
    category_id: "",
    account_id: "",
    scope: "PJ",
    frequency: "monthly",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    next_due_date: new Date().toISOString().slice(0, 10),
    status: "active",
    payment_method: "pix",
    notes: "",
  }
}

function toFormValues(recurrence: Recurrence): FormValues {
  return {
    description: recurrence.description,
    amount: recurrence.amount,
    type: recurrence.type,
    category_id: recurrence.category_id,
    account_id: recurrence.account_id,
    scope: recurrence.scope,
    frequency: recurrence.frequency,
    start_date: recurrence.start_date,
    end_date: recurrence.end_date || "",
    next_due_date: recurrence.next_due_date,
    status: recurrence.status,
    payment_method: recurrence.payment_method,
    notes: recurrence.notes || "",
  }
}

export default function RecurrencesPage() {
  const finance = useFinance()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Recurrence | null>(null)
  const [scope, setScope] = React.useState<Scope | "ALL">("ALL")
  const [category, setCategory] = React.useState("ALL")
  const [frequency, setFrequency] = React.useState<RecurrenceFrequency | "ALL">("ALL")
  const [status, setStatus] = React.useState<RecurrenceStatus | "ALL">("ALL")
  const [saving, setSaving] = React.useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaultValues() })
  const selectedScope = useWatch({ control: form.control, name: "scope" })

  const recurrences = finance.recurrences
    .filter((item) => scope === "ALL" || item.scope === scope)
    .filter((item) => category === "ALL" || item.category_id === category)
    .filter((item) => frequency === "ALL" || item.frequency === frequency)
    .filter((item) => status === "ALL" || item.status === status)
    .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))

  function openNew() {
    setEditing(null)
    form.reset(defaultValues())
    setOpen(true)
  }

  function openEdit(recurrence: Recurrence) {
    setEditing(recurrence)
    form.reset(toFormValues(recurrence))
    setOpen(true)
  }

  function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const payload = {
        ...values,
        scope: values.description.toLowerCase().includes("das") ? "PJ" as const : values.scope,
        end_date: values.end_date || undefined,
        notes: values.notes || undefined,
      }
      if (editing) {
        finance.updateRecurrence(editing.id, payload)
        toast.success("Recorrencia atualizada.")
      } else {
        finance.addRecurrence(payload)
        toast.success("Recorrencia criada.")
      }
      setOpen(false)
      form.reset(defaultValues())
    } catch {
      toast.error("Nao foi possivel salvar a recorrencia.")
    } finally {
      setSaving(false)
    }
  }

  function generate(recurrence: Recurrence) {
    if (recurrence.status !== "active") {
      toast.error("Apenas recorrencias ativas podem gerar lancamentos.")
      return
    }
    finance.generateTransactionFromRecurrence(recurrence.id)
    toast.success("Lancamento gerado e proximo vencimento atualizado.")
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recorrencias</h2>
          <p className="mt-1 text-muted-foreground">DAS, softwares, assinaturas e contas fixas com geracao de lancamento.</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button onClick={openNew} />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Recorrencia
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-auto sm:max-w-[540px]">
            <SheetHeader>
              <SheetTitle>{editing ? "Editar recorrencia" : "Nova recorrencia"}</SheetTitle>
              <SheetDescription>Recorrencias ativas aparecem nos proximos vencimentos e podem gerar lancamentos.</SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descricao</FormLabel><FormControl><Input placeholder="Ex: DAS do MEI, ChatGPT, Canva..." {...field} onChange={(event) => { field.onChange(event); if (event.target.value.toLowerCase().includes("das")) form.setValue("scope", "PJ") }} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Valor</FormLabel><FormControl><Input type="number" step="0.01" value={field.value} onChange={(event) => field.onChange(event.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Tipo</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="income">Entrada</SelectItem><SelectItem value="expense">Saida</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="scope" render={({ field }) => (
                    <FormItem><FormLabel>Escopo</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="frequency" render={({ field }) => (
                    <FormItem><FormLabel>Frequencia</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(frequencyLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem><FormLabel>Categoria</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{finance.categories.filter((item) => item.scope === selectedScope).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="account_id" render={({ field }) => (
                  <FormItem><FormLabel>Conta</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{finance.accounts.filter((item) => item.scope === selectedScope).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="start_date" render={({ field }) => (
                    <FormItem><FormLabel>Data inicial</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="next_due_date" render={({ field }) => (
                    <FormItem><FormLabel>Proximo vencimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="end_date" render={({ field }) => (
                    <FormItem><FormLabel>Data final</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="payment_method" render={({ field }) => (
                  <FormItem><FormLabel>Forma de pagamento</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(paymentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
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
        <SummaryCard title="Ativas" value={String(finance.recurrences.filter((item) => item.status === "active").length)} />
        <SummaryCard title="Pausadas" value={String(finance.recurrences.filter((item) => item.status === "paused").length)} />
        <SummaryCard title="Proximos 30 dias" value={String(finance.recurrences.filter((item) => item.status === "active").length)} />
        <SummaryCard title="Custo mensal ativo" value={formatCurrency(finance.recurrences.filter((item) => item.status === "active" && item.frequency === "monthly" && item.type === "expense").reduce((total, item) => total + item.amount, 0))} />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
          <div className="grid gap-3 md:grid-cols-4">
            <FilterSelect value={scope} onChange={setScope} items={[["ALL", "PF e PJ"], ["PF", "PF"], ["PJ", "PJ"]]} />
            <FilterSelect value={category} onChange={setCategory} items={[["ALL", "Todas categorias"], ...finance.categories.map((item) => [item.id, item.name] as [string, string])]} />
            <FilterSelect value={frequency} onChange={setFrequency} items={[["ALL", "Todas frequencias"], ["weekly", "Semanal"], ["monthly", "Mensal"], ["yearly", "Anual"]]} />
            <FilterSelect value={status} onChange={setStatus} items={[["ALL", "Todos status"], ["active", "Ativa"], ["paused", "Pausada"], ["finished", "Finalizada"]]} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {recurrences.map((item) => {
            const categoryInfo = finance.categories.find((categoryItem) => categoryItem.id === item.category_id)
            const account = finance.accounts.find((accountItem) => accountItem.id === item.account_id)
            return (
              <div key={item.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Repeat className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{item.description}</h3>
                      <ScopeBadge scope={item.scope} />
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{categoryInfo?.name} - {account?.name}</p>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-xl font-bold", item.type === "income" ? "text-emerald-600" : "")}>{formatCurrency(item.amount)}</div>
                    <div className="text-xs text-muted-foreground">{frequencyLabels[item.frequency]}</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-2">
                  <span>Proximo vencimento: <strong>{formatDate(item.next_due_date)}</strong></span>
                  <span>Forma: <strong>{paymentLabels[item.payment_method]}</strong></span>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}><Edit className="mr-2 h-4 w-4" />Editar</Button>
                  {item.status === "active" ? <Button variant="outline" size="sm" onClick={() => finance.setRecurrenceStatus(item.id, "paused")}><PauseCircle className="mr-2 h-4 w-4" />Pausar</Button> : item.status === "paused" ? <Button variant="outline" size="sm" onClick={() => finance.setRecurrenceStatus(item.id, "active")}><PlayCircle className="mr-2 h-4 w-4" />Ativar</Button> : null}
                  {item.status !== "finished" && <Button variant="outline" size="sm" onClick={() => finance.setRecurrenceStatus(item.id, "finished")}><StopCircle className="mr-2 h-4 w-4" />Finalizar</Button>}
                  <Button size="sm" onClick={() => generate(item)}><Wand2 className="mr-2 h-4 w-4" />Gerar lancamento</Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
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

function StatusBadge({ status }: { status: RecurrenceStatus }) {
  return <Badge variant="outline" className={cn(status === "active" && "border-emerald-500 text-emerald-600", status === "paused" && "border-amber-500 text-amber-600", status === "finished" && "border-muted-foreground text-muted-foreground")}>{statusLabels[status]}</Badge>
}
