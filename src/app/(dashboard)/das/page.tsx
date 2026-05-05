"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AlertTriangle, CalendarDays, CheckCircle2, PlusCircle, ReceiptText, Upload } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFinance } from "@/lib/finance/store"
import { useLevel2 } from "@/components/providers/level2-provider"
import { DasRecord, DasStatus } from "@/lib/level2/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { EmptyState } from "@/components/finance/empty-state"

const schema = z.object({
  reference_month: z.string().min(1, "Informe o mes de referencia"),
  due_date: z.string().min(1, "Informe a data de vencimento"),
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const statusLabels: Record<DasStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Vencido",
}

export default function DasPage() {
  const finance = useFinance()
  const level2 = useLevel2()
  const [open, setOpen] = React.useState(false)
  const [paymentTarget, setPaymentTarget] = React.useState<DasRecord | null>(null)
  const [paymentAccount, setPaymentAccount] = React.useState("")
  const [attachmentTarget, setAttachmentTarget] = React.useState<DasRecord | null>(null)
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      reference_month: new Date().toISOString().slice(0, 7),
      due_date: new Date().toISOString().slice(0, 10),
      amount: 0,
      notes: "",
    },
  })

  const records = level2.dasRecords
  const pending = records.filter((item) => item.status === "pending")
  const overdue = records.filter((item) => item.status === "overdue")
  const paid = records.filter((item) => item.status === "paid")

  function submit(values: FormValues) {
    level2.addDasRecord({
      reference_month: values.reference_month,
      due_date: values.due_date,
      amount: values.amount,
      status: values.due_date < new Date().toISOString().slice(0, 10) ? "overdue" : "pending",
      notes: values.notes || undefined,
    })
    toast.success("DAS cadastrado.")
    form.reset()
    setOpen(false)
  }

  function markPaid() {
    if (!paymentTarget || !paymentAccount) {
      toast.error("Escolha a conta de pagamento.")
      return
    }
    level2.payDasRecord(paymentTarget.id, paymentAccount)
    setPaymentTarget(null)
  }

  async function handleAttachment(file?: File) {
    if (!attachmentTarget || !file) return
    try {
      const attachment = await level2.addAttachment({ entity_type: "das", entity_id: attachmentTarget.id, file })
      if (attachment) {
        level2.updateDasRecord(attachmentTarget.id, { ...attachmentTarget, attachment_id: attachment.id })
      }
      toast.success("Comprovante anexado ao DAS.")
    } catch (error) {
      console.error(error)
      toast.error("Nao foi possivel anexar o comprovante.")
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">DAS</h2>
          <p className="mt-1 text-muted-foreground">Controle de obrigacoes, pagamentos, comprovantes e alertas de vencimento do MEI.</p>
        </div>
        <Button onClick={() => setOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Novo DAS</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" />Pendentes</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{pending.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />Vencidos</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overdue.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" />Pagos</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{paid.length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historico de DAS</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="Nenhum DAS cadastrado"
              description="Cadastre sua primeira obrigacao mensal para acompanhar alertas e pagamentos."
              actionLabel="Novo DAS"
              actionHref="/das"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comprovante</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.reference_month}</TableCell>
                    <TableCell>{formatDate(record.due_date)}</TableCell>
                    <TableCell>{formatCurrency(record.amount)}</TableCell>
                    <TableCell><StatusBadge status={record.status} /></TableCell>
                    <TableCell>{record.attachment_id ? <Badge>Comprovante</Badge> : <span className="text-xs text-muted-foreground">Sem anexo</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setAttachmentTarget(record); fileRef.current?.click() }}>
                          <Upload className="mr-2 h-4 w-4" />Anexar
                        </Button>
                        {record.status !== "paid" && (
                          <Button size="sm" onClick={() => { setPaymentTarget(record); setPaymentAccount(finance.accounts.find((item) => item.scope === "PJ")?.id || finance.accounts[0]?.id || "") }}>
                            Marcar como pago
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo DAS</DialogTitle>
            <DialogDescription>Cadastre a referencia, vencimento e valor para acompanhar o pagamento.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="grid gap-3" onSubmit={form.handleSubmit(submit)}>
              <FormField control={form.control} name="reference_month" render={({ field }) => <FormItem><FormLabel>Referencia</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="due_date" render={({ field }) => <FormItem><FormLabel>Vencimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="amount" render={({ field }) => <FormItem><FormLabel>Valor</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>Observacao</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentTarget} onOpenChange={(open) => !open && setPaymentTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar DAS como pago</DialogTitle>
            <DialogDescription>Escolha a conta de saida para registrar o pagamento real.</DialogDescription>
          </DialogHeader>
          <Select value={paymentAccount} onValueChange={(value) => setPaymentAccount(value || "")}>
            <SelectTrigger><SelectValue placeholder="Conta de pagamento" /></SelectTrigger>
            <SelectContent>{finance.accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentTarget(null)}>Cancelar</Button>
            <Button onClick={markPaid}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(event) => {
          void handleAttachment(event.target.files?.[0] || undefined)
          event.currentTarget.value = ""
        }}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: DasStatus }) {
  const classes: Record<DasStatus, string> = {
    pending: "border-amber-500 text-amber-600",
    overdue: "border-rose-500 text-rose-600",
    paid: "border-emerald-500 text-emerald-600",
  }
  return <Badge variant="outline" className={classes[status]}>{statusLabels[status]}</Badge>
}
