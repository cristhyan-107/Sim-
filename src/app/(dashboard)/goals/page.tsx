"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Target, PlusCircle, Wallet, CircleMinus, CirclePlus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/finance/empty-state"
import { useFinance } from "@/lib/finance/store"
import { useLevel2 } from "@/components/providers/level2-provider"
import { formatCurrency } from "@/lib/utils"

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  target_amount: z.coerce.number().positive(),
  scope: z.enum(["PF", "PJ"]),
  category_id: z.string().optional(),
  deadline: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function GoalsPage() {
  const finance = useFinance()
  const level2 = useLevel2()
  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [changeTarget, setChangeTarget] = React.useState<{ id: string; mode: "add" | "withdraw" } | null>(null)
  const [amount, setAmount] = React.useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { name: "", description: "", target_amount: 0, scope: "PF", category_id: "", deadline: "" },
  })

  const editingGoal = level2.goals.find((goal) => goal.id === editingId) || null
  const goals = level2.goals

  function submit(values: FormValues) {
    if (editingGoal) {
      level2.updateGoal(editingGoal.id, {
        ...editingGoal,
        ...values,
        description: values.description || undefined,
        category_id: values.category_id || undefined,
        deadline: values.deadline || undefined,
      })
      toast.success("Meta atualizada.")
    } else {
      level2.addGoal({
        ...values,
        description: values.description || undefined,
        category_id: values.category_id || undefined,
        deadline: values.deadline || undefined,
        current_amount: 0,
        status: "active",
      })
      toast.success("Meta criada.")
    }
    setOpen(false)
    setEditingId(null)
  }

  function openEdit(id: string) {
    const goal = level2.goals.find((item) => item.id === id)
    if (!goal) return
    setEditingId(id)
    form.reset({
      name: goal.name,
      description: goal.description || "",
      target_amount: goal.target_amount,
      scope: goal.scope,
      category_id: goal.category_id || "",
      deadline: goal.deadline || "",
    })
    setOpen(true)
  }

  const totalProgress = goals.reduce((sum, goal) => sum + goal.current_amount, 0)
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0)

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Metas e Reservas</h2>
          <p className="mt-1 text-muted-foreground">Acompanhe reservas PF e PJ com progresso e movimentos de entrada/saida.</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ name: "", description: "", target_amount: 0, scope: "PF", category_id: "", deadline: "" }); setOpen(true) }}>
          <PlusCircle className="mr-2 h-4 w-4" />Nova meta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Total acumulado" value={formatCurrency(totalProgress)} />
        <Stat title="Meta total" value={formatCurrency(totalTarget)} />
        <Stat title="Reservas ativas" value={String(goals.filter((goal) => goal.status === "active").length)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Suas metas</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {goals.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nenhuma meta cadastrada"
              description="Crie metas para reserva pessoal, reserva da empresa, equipamento ou impostos."
              actionLabel="Nova meta"
              actionHref="/goals"
            />
          ) : goals.map((goal) => {
            const progress = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0
            return (
              <div key={goal.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong>{goal.name}</strong>
                      <Badge variant="outline">{goal.scope}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{goal.description || "Sem descricao"}</p>
                  </div>
                  <Badge>{goal.status}</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <Progress value={progress} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.current_amount)}</span>
                    <span>{formatCurrency(goal.target_amount)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(goal.id)}><Target className="mr-2 h-4 w-4" />Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => setChangeTarget({ id: goal.id, mode: "add" })}><CirclePlus className="mr-2 h-4 w-4" />Adicionar</Button>
                  <Button size="sm" variant="outline" onClick={() => setChangeTarget({ id: goal.id, mode: "withdraw" })}><CircleMinus className="mr-2 h-4 w-4" />Retirar</Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Editar meta" : "Nova meta"}</DialogTitle>
            <DialogDescription>Defina o alvo financeiro e o escopo da reserva.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="grid gap-3" onSubmit={form.handleSubmit(submit)}>
              <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Descricao</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="target_amount" render={({ field }) => <FormItem><FormLabel>Meta</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="scope" render={({ field }) => <FormItem><FormLabel>Escopo</FormLabel><FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="category_id" render={({ field }) => <FormItem><FormLabel>Categoria</FormLabel><FormControl><Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{finance.categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="deadline" render={({ field }) => <FormItem><FormLabel>Prazo</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!changeTarget} onOpenChange={(open) => !open && setChangeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{changeTarget?.mode === "add" ? "Adicionar valor" : "Retirar valor"}</DialogTitle>
          </DialogHeader>
          <Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" step="0.01" placeholder="Valor" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeTarget(null)}>Cancelar</Button>
            <Button onClick={() => {
              if (!changeTarget) return
              const numeric = Number(amount)
              if (!numeric || numeric <= 0) return toast.error("Informe um valor maior que zero.")
              if (changeTarget.mode === "add") level2.addToGoal(changeTarget.id, numeric)
              else level2.withdrawFromGoal(changeTarget.id, numeric)
              setAmount("")
              setChangeTarget(null)
            }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ title, value }: { title: string; value: string }) {
  return <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
}
