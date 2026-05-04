"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import {
  ArrowDownCircle,
  ArrowRightLeft,
  ArrowUpCircle,
  CalendarDays,
  Filter,
  MoreHorizontal,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFinance } from "@/lib/finance/store"
import { PaymentMethod, Scope, Transaction, TransactionType } from "@/lib/finance/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

const schema = z.object({
  date: z.string().min(1, "Informe a data"),
  description: z.string().min(3, "Descreva o lancamento"),
  amount: z.number().positive("Informe um valor maior que zero"),
  type: z.enum(["income", "expense", "transfer", "owner_withdrawal", "invoice_payment", "das_payment"]),
  category_id: z.string().min(1, "Selecione a categoria"),
  account_id: z.string().min(1, "Selecione a conta de origem"),
  destination_account_id: z.string().optional(),
  scope: z.enum(["PF", "PJ"]),
  payment_method: z.enum(["pix", "debit", "credit_card", "cash", "bank_slip", "transfer", "other"]),
  card_id: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "transfer" && !data.destination_account_id) {
    ctx.addIssue({ code: "custom", path: ["destination_account_id"], message: "Escolha a conta de destino" })
  }
  if (data.type === "owner_withdrawal") {
    if (data.scope !== "PJ") ctx.addIssue({ code: "custom", path: ["scope"], message: "Retirada do dono deve ser PJ" })
    if (!data.destination_account_id) ctx.addIssue({ code: "custom", path: ["destination_account_id"], message: "Escolha uma conta PF de destino" })
  }
  if (data.type === "das_payment" && data.scope !== "PJ") {
    ctx.addIssue({ code: "custom", path: ["scope"], message: "Pagamento DAS deve ser PJ" })
  }
  if (data.payment_method === "credit_card" && !data.card_id) {
    ctx.addIssue({ code: "custom", path: ["card_id"], message: "Escolha o cartao usado" })
  }
})

type FormValues = z.infer<typeof schema>

const typeLabels: Record<TransactionType, string> = {
  income: "Entrada",
  expense: "Saida",
  transfer: "Transferencia",
  owner_withdrawal: "Retirada do dono",
  invoice_payment: "Pagamento de fatura",
  das_payment: "Pagamento DAS",
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

function getTransactionIcon(type: TransactionType) {
  if (type === "income") return <ArrowUpCircle className="mr-2 h-4 w-4 text-emerald-500" />
  if (type === "transfer" || type === "owner_withdrawal") return <ArrowRightLeft className="mr-2 h-4 w-4 text-amber-500" />
  return <ArrowDownCircle className="mr-2 h-4 w-4 text-rose-500" />
}

function defaultValues(): FormValues {
  return {
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: 0,
    type: "expense",
    category_id: "",
    account_id: "",
    destination_account_id: "",
    scope: "PF",
    payment_method: "pix",
    card_id: "",
    notes: "",
  }
}

function toFormValues(transaction: Transaction): FormValues {
  return {
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category_id: transaction.category_id,
    account_id: transaction.account_id,
    destination_account_id: transaction.destination_account_id || "",
    scope: transaction.scope,
    payment_method: transaction.payment_method,
    card_id: transaction.card_id || "",
    notes: transaction.notes || "",
  }
}

export default function TransactionsPage() {
  const finance = useFinance()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Transaction | null>(null)
  const [search, setSearch] = React.useState("")
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7))
  const [scope, setScope] = React.useState<Scope | "ALL">("ALL")
  const [account, setAccount] = React.useState("ALL")
  const [category, setCategory] = React.useState("ALL")
  const [type, setType] = React.useState<TransactionType | "ALL">("ALL")
  const [payment, setPayment] = React.useState<PaymentMethod | "ALL">("ALL")
  const [isSaving, setIsSaving] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(),
  })

  const selectedType = useWatch({ control: form.control, name: "type" })
  const selectedScope = useWatch({ control: form.control, name: "scope" })
  const selectedPayment = useWatch({ control: form.control, name: "payment_method" })
  const selectedAccount = useWatch({ control: form.control, name: "account_id" })

  const filtered = finance.transactions
    .filter((tx) => tx.description.toLowerCase().includes(search.toLowerCase()))
    .filter((tx) => !month || tx.date.startsWith(month))
    .filter((tx) => scope === "ALL" || tx.scope === scope)
    .filter((tx) => account === "ALL" || tx.account_id === account || tx.destination_account_id === account)
    .filter((tx) => category === "ALL" || tx.category_id === category)
    .filter((tx) => type === "ALL" || tx.type === type)
    .filter((tx) => payment === "ALL" || tx.payment_method === payment)
    .sort((a, b) => b.date.localeCompare(a.date))

  const income = filtered.filter((tx) => tx.type === "income").reduce((total, tx) => total + tx.amount, 0)
  const expenses = filtered
    .filter((tx) => ["expense", "invoice_payment", "das_payment", "owner_withdrawal"].includes(tx.type))
    .reduce((total, tx) => total + tx.amount, 0)
  const transfers = filtered.filter((tx) => ["transfer", "owner_withdrawal"].includes(tx.type)).reduce((total, tx) => total + tx.amount, 0)

  const categories = finance.categories.filter((item) => item.scope === selectedScope)
  const originAccounts = finance.accounts.filter((item) => {
    if (selectedType === "owner_withdrawal" || selectedType === "das_payment") return item.scope === "PJ"
    return item.scope === selectedScope
  })
  const destinationAccounts = finance.accounts.filter((item) => {
    if (selectedType === "owner_withdrawal") return item.scope === "PF"
    return item.id !== selectedAccount
  })
  const cards = finance.cards.filter((item) => item.scope === selectedScope)

  function openNew() {
    setEditing(null)
    form.reset(defaultValues())
    setOpen(true)
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction)
    form.reset(toFormValues(transaction))
    setOpen(true)
  }

  function onSubmit(values: FormValues) {
    setIsSaving(true)
    try {
      const payload = {
        ...values,
        destination_account_id: values.destination_account_id || undefined,
        card_id: values.card_id || undefined,
        notes: values.notes || undefined,
      }
      if (editing) {
        finance.updateTransaction(editing.id, payload)
        toast.success("Lancamento atualizado com sucesso.")
      } else {
        finance.addTransaction(payload)
        toast.success("Lancamento salvo e saldos atualizados.")
      }
      setOpen(false)
      form.reset(defaultValues())
    } catch {
      toast.error("Nao foi possivel salvar o lancamento.")
    } finally {
      setIsSaving(false)
    }
  }

  function removeTransaction(transaction: Transaction) {
    if (!window.confirm(`Excluir o lancamento "${transaction.description}"?`)) return
    finance.deleteTransaction(transaction.id)
    toast.success("Lancamento excluido e resumos recalculados.")
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lancamentos</h2>
          <p className="mt-1 text-muted-foreground">Controle entradas, saidas, transferencias, DAS e pagamentos de fatura.</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button onClick={openNew} />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Lancamento
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-auto sm:max-w-[560px]">
            <SheetHeader>
              <SheetTitle>{editing ? "Editar lancamento" : "Novo lancamento"}</SheetTitle>
              <SheetDescription>Use o tipo do lancamento para definir se o saldo entra, sai ou transfere entre contas.</SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl><Input type="number" step="0.01" value={field.value} onChange={(event) => field.onChange(event.target.valueAsNumber || 0)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descricao</FormLabel>
                    <FormControl><Input placeholder="Ex: Cliente X, Mercado, DAS..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="scope" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escopo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={(value) => {
                        field.onChange(value)
                        if (value === "owner_withdrawal" || value === "das_payment") form.setValue("scope", "PJ")
                      }}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(typeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="account_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{["transfer", "owner_withdrawal"].includes(selectedType) ? "Conta origem" : "Conta"}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>{originAccounts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {["transfer", "owner_withdrawal"].includes(selectedType) ? (
                    <FormField control={form.control} name="destination_account_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta destino</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                          <SelectContent>{destinationAccounts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} ({item.scope})</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ) : (
                    <FormField control={form.control} name="category_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                          <SelectContent>{categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>

                {["transfer", "owner_withdrawal"].includes(selectedType) && (
                  <FormField control={form.control} name="category_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>{categories.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="payment_method" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de pagamento</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{Object.entries(paymentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {selectedPayment === "credit_card" && (
                    <FormField control={form.control} name="card_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cartao</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                          <SelectContent>{cards.map((item) => <SelectItem key={item.id} value={item.id}>{item.nickname}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observacao</FormLabel>
                    <FormControl><Textarea placeholder="Detalhes adicionais..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <SheetFooter className="px-0">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm text-emerald-600">Entradas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(income)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-rose-600">Saidas</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(expenses)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-amber-600">Transferencias</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(transfers)}</CardContent></Card>
        <Card className="bg-primary text-primary-foreground"><CardHeader><CardTitle className="text-sm">Resultado</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatCurrency(income - expenses)}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="relative md:col-span-2 xl:col-span-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Buscar descricao..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            <FilterSelect value={scope} onChange={setScope} items={[["ALL", "Todos"], ["PF", "PF"], ["PJ", "PJ"]]} />
            <FilterSelect value={account} onChange={setAccount} items={[["ALL", "Todas as contas"], ...finance.accounts.map((item) => [item.id, item.name] as [string, string])]} />
            <FilterSelect value={category} onChange={setCategory} items={[["ALL", "Todas as categorias"], ...finance.categories.map((item) => [item.id, item.name] as [string, string])]} />
            <FilterSelect value={type} onChange={setType} items={[["ALL", "Todos os tipos"], ...Object.entries(typeLabels)]} />
            <FilterSelect value={payment} onChange={setPayment} items={[["ALL", "Todas as formas"], ...Object.entries(paymentLabels)]} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descricao</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Nenhum lancamento encontrado.</TableCell></TableRow>
                ) : filtered.map((tx) => {
                  const origin = finance.accounts.find((item) => item.id === tx.account_id)
                  const destination = finance.accounts.find((item) => item.id === tx.destination_account_id)
                  const categoryName = finance.categories.find((item) => item.id === tx.category_id)?.name
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap"><CalendarDays className="mr-2 inline h-4 w-4 text-muted-foreground" />{formatDate(tx.date)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">{origin?.name}{destination ? ` -> ${destination.name}` : ""} {categoryName ? `- ${categoryName}` : ""}</div>
                      </TableCell>
                      <TableCell><ScopeBadge scope={tx.scope} /></TableCell>
                      <TableCell><div className="flex items-center">{getTransactionIcon(tx.type)}{typeLabels[tx.type]}</div></TableCell>
                      <TableCell>{paymentLabels[tx.payment_method]}</TableCell>
                      <TableCell className={cn("text-right font-semibold", tx.type === "income" ? "text-emerald-600" : ["transfer", "owner_withdrawal"].includes(tx.type) ? "text-amber-600" : "text-foreground")}>{tx.type === "income" ? "+" : tx.type === "transfer" ? "" : "-"}{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEdit(tx)}>Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => removeTransaction(tx)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
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
  return (
    <Badge variant="outline" className={scope === "PF" ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950" : "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950"}>
      {scope}
    </Badge>
  )
}
