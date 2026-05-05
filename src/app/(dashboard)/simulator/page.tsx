"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { AlertTriangle, Calculator, CreditCard, PlusCircle, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFinance } from "@/lib/finance/store"
import { generateInstallments, toMonth } from "@/lib/finance/engine"
import { formatCurrency } from "@/lib/utils"
import { EmptyState } from "@/components/finance/empty-state"

const schema = z.object({
  description: z.string().min(2),
  total_amount: z.coerce.number().positive(),
  installments_count: z.coerce.number().int().min(2).max(24),
  card_id: z.string().min(1),
  category_id: z.string().min(1),
  scope: z.enum(["PF", "PJ"]),
  first_invoice_month: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

export default function SimulatorPage() {
  const finance = useFinance()
  const [result, setResult] = React.useState<FormValues | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      description: "",
      total_amount: 0,
      installments_count: 6,
      card_id: finance.cards[0]?.id || "",
      category_id: finance.categories[0]?.id || "",
      scope: "PF",
      first_invoice_month: toMonth(new Date()),
    },
  })

  const values = useWatch({ control: form.control })
  const currentCard = finance.cards.find((item) => item.id === values.card_id)
  const purchase = result
    ? {
        id: "sim",
        description: result.description,
        total_amount: result.total_amount,
        installments_count: result.installments_count,
        installment_amount: result.total_amount / result.installments_count,
        card_id: result.card_id,
        category_id: result.category_id,
        scope: result.scope,
        purchase_date: new Date().toISOString().slice(0, 10),
        first_invoice_month: result.first_invoice_month,
        status: "active" as const,
      }
    : null

  const installments = purchase ? generateInstallments(purchase).filter((item) => item.status !== "cancelled") : []
  const chartData = purchase
    ? Array.from(new Set(installments.map((item) => item.due_month))).map((month) => ({
        month,
        valor: installments.filter((item) => item.due_month === month).reduce((total, item) => total + item.amount, 0),
      }))
    : []

  function simulate(values: FormValues) {
    setResult(values)
  }

  function transformToPurchase() {
    if (!result) return
    finance.addPurchase({
      description: result.description,
      total_amount: result.total_amount,
      installments_count: result.installments_count,
      card_id: result.card_id,
      category_id: result.category_id,
      scope: result.scope,
      purchase_date: new Date().toISOString().slice(0, 10),
      first_invoice_month: result.first_invoice_month,
      notes: "Criado a partir do simulador",
    })
    setResult(null)
  }

  const maxMonthValue = chartData.reduce((max, item) => Math.max(max, item.valor), 0)

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Simulador de parcelamento</h2>
        <p className="mt-1 text-muted-foreground">Teste o impacto antes de assumir a compra no fluxo real.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Simular compra</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={form.handleSubmit(simulate)}>
              <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Descricao</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="total_amount" render={({ field }) => <FormItem><FormLabel>Valor total</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="installments_count" render={({ field }) => <FormItem><FormLabel>Parcelas</FormLabel><FormControl><Input type="number" min={2} max={24} {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="card_id" render={({ field }) => <FormItem><FormLabel>Cartao</FormLabel><FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{finance.cards.map((card) => <SelectItem key={card.id} value={card.id}>{card.nickname}</SelectItem>)}</SelectContent></Select></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="category_id" render={({ field }) => <FormItem><FormLabel>Categoria</FormLabel><FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{finance.categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="scope" render={({ field }) => <FormItem><FormLabel>Escopo</FormLabel><FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="first_invoice_month" render={({ field }) => <FormItem><FormLabel>Primeira fatura</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>} />
              <div className="flex items-end gap-2">
                <Button type="submit"><Calculator className="mr-2 h-4 w-4" />Simular</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {!result ? (
        <EmptyState icon={CreditCard} title="Nenhuma simulacao feita" description="Preencha o formulario para visualizar impacto mensal, alertas e a fatura estimada." actionLabel="Simular agora" actionHref="/simulator" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Metric title="Parcela" value={formatCurrency(result.total_amount / result.installments_count)} />
              <Metric title="Meses impactados" value={String(installments.length)} />
              <Metric title="Cartao" value={currentCard?.nickname || "-"} />
            </CardContent>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle>Impacto mensal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="valor" fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {maxMonthValue > 0 && <AlertBox icon={<AlertTriangle className="h-4 w-4" />} text={`Maior comprometimento estimado: ${formatCurrency(maxMonthValue)}`} />}
                <AlertBox icon={<Target className="h-4 w-4" />} text={result.total_amount / result.installments_count > 500 ? "Parcela acima de R$ 500. Revise o fluxo." : "Parcela dentro do intervalo seguro."} />
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={transformToPurchase}><PlusCircle className="mr-2 h-4 w-4" />Transformar em compra parcelada</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string }) {
  return <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{title}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>
}

function AlertBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-start gap-2 rounded-lg border p-3 text-sm text-muted-foreground">{icon}<span>{text}</span></div>
}
