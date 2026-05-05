"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/finance/empty-state"
import { useFinance } from "@/lib/finance/store"
import { normalizeText } from "@/lib/level2/automation"
import { parseImportFile, type ImportColumnMapping, type ParsedImportRow } from "@/lib/level2/parsers"
import { useLevel2 } from "@/components/providers/level2-provider"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowDownUp, FileUp, Filter, PlusCircle, RotateCcw, Search, Tags, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ImportedTransaction, ImportedTransactionStatus } from "@/lib/level2/types"
import { Scope } from "@/lib/finance/types"

const mappingSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  amount: z.string().min(1),
  type: z.string().optional(),
  account: z.string().optional(),
  card: z.string().optional(),
})

type MappingValues = z.infer<typeof mappingSchema>

function autoMap(headers: string[]): MappingValues {
  const find = (candidates: string[]) => headers.find((header) => candidates.some((candidate) => normalizeText(header).includes(normalizeText(candidate)))) || headers[0] || ""
  return {
    date: find(["data", "date", "dt"]),
    description: find(["descricao", "descrição", "historico", "hist", "memo", "name"]),
    amount: find(["valor", "amount", "amt", "debito", "credito"]),
    type: find(["tipo", "type"]),
    account: find(["conta", "account", "origem"]),
    card: find(["cartao", "card"]),
  }
}

function detectFileType(fileName: string) {
  return fileName.toLowerCase().endsWith(".ofx") ? "ofx" : "csv"
}

export default function ImportsPage() {
  const finance = useFinance()
  const level2 = useLevel2()
  const [rows, setRows] = React.useState<ParsedImportRow[]>([])
  const [headers, setHeaders] = React.useState<string[]>([])
  const [fileName, setFileName] = React.useState("")
  const [fileType, setFileType] = React.useState<"csv" | "ofx">("csv")
  const [sourceBank, setSourceBank] = React.useState("")
  const [batchId, setBatchId] = React.useState("")
  const [selected, setSelected] = React.useState<string[]>([])
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [clearDialog, setClearDialog] = React.useState(false)

  const form = useForm<MappingValues>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      date: "",
      description: "",
      amount: "",
      type: "",
      account: "",
      card: "",
    },
  })
  const mappingValues = useWatch({ control: form.control }) as Partial<MappingValues>

  const pendingItems = level2.importedTransactions.filter((item) => item.status === "pending" || item.status === "duplicate")
  const activeBatchItems = batchId ? pendingItems.filter((item) => item.batch_id === batchId) : pendingItems
  const currentBatch = level2.importBatches.find((item) => item.id === batchId) || level2.importBatches[0]
  const pendingCount = level2.importedTransactions.filter((item) => item.status === "pending").length
  const duplicateCount = level2.importedTransactions.filter((item) => item.status === "duplicate").length
  const approvedCount = level2.importedTransactions.filter((item) => item.status === "approved").length

  React.useEffect(() => {
    if (!headers.length) return
    form.reset(autoMap(headers))
  }, [headers, form])

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const inferredType = detectFileType(file.name)
    setFileType(inferredType)
    try {
      const content = await file.text()
      const parsed = parseImportFile(content, inferredType)
      setRows(parsed)
      setHeaders(parsed[0] ? Object.keys(parsed[0]) : [])
      if (!parsed.length) toast.error("Nao foi possivel ler linhas validas do arquivo.")
    } catch (error) {
      console.error(error)
      toast.error("Nao foi possivel ler o arquivo selecionado.")
    }
  }

  function createBatch(values: MappingValues) {
    if (!rows.length) {
      toast.error("Selecione um arquivo primeiro.")
      return
    }
    const batch = level2.registerImportBatch({
      fileName: fileName || "extrato",
      fileType,
      sourceBank: sourceBank || "Desconhecido",
      rows,
      mapping: values as ImportColumnMapping,
    })
    setBatchId(batch.id)
    setSelected([])
    toast.success("Lote importado para revisao.")
  }

  function clearCurrent() {
    level2.clearImportedData()
    setSelected([])
    setBatchId("")
    setRows([])
    setHeaders([])
    setFileName("")
  }

  const editTarget = level2.importedTransactions.find((item) => item.id === editingId) || null

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Importacoes</h2>
          <p className="mt-1 text-muted-foreground">Importe CSV/OFX, revise pendencias, deduplique e transforme tudo em lancamentos reais.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setClearDialog(true)}><Trash2 className="mr-2 h-4 w-4" />Limpar fila</Button>
          <Button variant="outline" onClick={() => setBatchId(level2.importBatches[0]?.id || "")}><RotateCcw className="mr-2 h-4 w-4" />Ver ultimo lote</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Pendentes" value={pendingCount} icon={<Filter className="h-4 w-4" />} />
        <Metric title="Duplicados" value={duplicateCount} icon={<ArrowDownUp className="h-4 w-4" />} />
        <Metric title="Aprovados" value={approvedCount} icon={<PlusCircle className="h-4 w-4" />} />
        <Metric title="Regras ativas" value={level2.categoryRules.filter((item) => item.active).length} icon={<Tags className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importar extrato</CardTitle>
          <CardDescription>Envie um CSV ou OFX, mapeie colunas quando necessario e crie um lote de revisao.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Arquivo CSV/OFX</Label>
              <Input type="file" accept=".csv,.ofx,text/csv,text/plain,application/ofx" onChange={onFileChange} />
              <p className="text-xs text-muted-foreground">{fileName || "Nenhum arquivo selecionado."}</p>
            </div>
            <div className="grid gap-2">
              <Label>Banco/Origem</Label>
              <Input value={sourceBank} onChange={(event) => setSourceBank(event.target.value)} placeholder="Ex.: Nubank, Inter, C6, Itaú" />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de arquivo</Label>
              <Select value={fileType} onValueChange={(value) => setFileType(value as "csv" | "ofx")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="ofx">OFX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <h3 className="font-semibold">Mapeamento de colunas</h3>
              <p className="mb-4 text-sm text-muted-foreground">Ajuste apenas se o CSV usar nomes diferentes.</p>
              <form className="grid gap-3" onSubmit={form.handleSubmit(createBatch)}>
                {[
                  ["date", "Coluna de data"],
                  ["description", "Coluna de descricao"],
                  ["amount", "Coluna de valor"],
                  ["type", "Coluna de tipo"],
                  ["account", "Coluna de conta"],
                  ["card", "Coluna de cartao"],
                ].map(([field, label]) => (
                  <div key={field} className="grid gap-2">
                    <Label>{label}</Label>
                      <Select value={(mappingValues[field as keyof MappingValues] as string) || ""} onValueChange={(value) => form.setValue(field as keyof MappingValues, value || "", { shouldValidate: true })}>
                      <SelectTrigger><SelectValue placeholder={headers.length ? "Selecione" : "Aguardando arquivo"} /></SelectTrigger>
                      <SelectContent>
                        {headers.map((header) => <SelectItem key={header} value={header}>{header}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <Button type="submit" disabled={!rows.length}><FileUp className="mr-2 h-4 w-4" />Criar lote</Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-4 w-4" />Lote atual</CardTitle>
          <CardDescription>{currentBatch ? `Lote ${currentBatch.file_name} com ${currentBatch.imported_count} item(ns).` : "Nenhum lote importado ainda."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeBatchItems.length === 0 ? (
            <EmptyState
              icon={FileUp}
              title="Nenhuma importacao pendente"
              description="Importe um extrato para revisar transacoes antes de transformalas em lancamentos reais."
              actionLabel="Escolher arquivo"
              actionHref="/imports"
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => level2.approveManyImportedTransactions(selected.length ? selected : activeBatchItems.map((item) => item.id))}
                  disabled={!activeBatchItems.length}
                >
                  Aprovar selecionados
                </Button>
                <Button variant="outline" onClick={() => (selected.length ? selected : activeBatchItems.map((item) => item.id)).forEach((id) => level2.ignoreImportedTransaction(id))}>
                  Ignorar selecionados
                </Button>
                <Button variant="outline" onClick={() => (selected.length ? selected : activeBatchItems.map((item) => item.id)).forEach((id) => level2.markImportedAsDuplicate(id))}>
                  Marcar duplicado
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Sugestao</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeBatchItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selected.includes(item.id)}
                            onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))}
                          />
                        </TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell className="max-w-[240px] truncate">{item.description}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{item.suggested_scope}</Badge>
                            <Badge variant="outline">{finance.categories.find((category) => category.id === item.selected_category_id)?.name || "Sem categoria"}</Badge>
                          </div>
                        </TableCell>
                        <TableCell><StatusBadge status={item.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingId(item.id)}>Editar</Button>
                            <Button size="sm" onClick={() => level2.approveImportedTransaction(item.id)}>Aprovar</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras de categorizacao</CardTitle>
          <CardDescription>Palavras-chave sugerem categoria e escopo automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {level2.categoryRules.map((rule) => (
            <div key={rule.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <strong className="truncate text-sm">{rule.keyword}</strong>
                <Badge variant={rule.active ? "default" : "outline"}>{rule.active ? "Ativa" : "Inativa"}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{finance.categories.find((category) => category.id === rule.category_id)?.name} - {rule.scope} - {rule.transaction_type}</p>
            </div>
          ))}
          <RuleCreator />
        </CardContent>
      </Card>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editar importacao</DialogTitle>
            <DialogDescription>Ajuste os campos antes de aprovar o lancamento.</DialogDescription>
          </DialogHeader>
          {editTarget && <EditImportForm item={editTarget} onSave={(patch) => { level2.updateImportedTransaction(editTarget.id, patch); setEditingId(null); toast.success("Importacao atualizada.") }} finance={finance} />}
        </DialogContent>
      </Dialog>

      <Dialog open={clearDialog} onOpenChange={setClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar fila de importacoes?</DialogTitle>
            <DialogDescription>Isso remove apenas os lotes pendentes desta sessao local.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { clearCurrent(); setClearDialog(false) }}>Limpar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EditImportForm({ item, onSave, finance }: { item: ImportedTransaction; onSave: (patch: Partial<ImportedTransaction>) => void; finance: ReturnType<typeof useFinance> }) {
  const [form, setForm] = React.useState({
    date: item.date,
    description: item.description,
    amount: String(item.amount),
    scope: item.selected_scope,
    category_id: item.selected_category_id || finance.categories[0]?.id || "",
    account_id: item.selected_account_id || finance.accounts[0]?.id || "",
  })
  return (
    <div className="grid gap-3">
      <Input value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} type="date" />
      <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descricao" />
      <Input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
      <Select value={form.scope} onValueChange={(value) => setForm({ ...form, scope: (value || "PF") as Scope })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent>
      </Select>
      <Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value || "" })}>
        <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
        <SelectContent>{finance.categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={form.account_id} onValueChange={(value) => setForm({ ...form, account_id: value || "" })}>
        <SelectTrigger><SelectValue placeholder="Conta" /></SelectTrigger>
        <SelectContent>{finance.accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
      </Select>
      <Button onClick={() => onSave({
        date: form.date,
        description: form.description,
        amount: Number(form.amount),
        selected_scope: form.scope,
        selected_category_id: form.category_id,
        selected_account_id: form.account_id,
        status: item.status,
      })}>Salvar</Button>
    </div>
  )
}

function RuleCreator() {
  const finance = useFinance()
  const level2 = useLevel2()
  const [open, setOpen] = React.useState(false)
  const [keyword, setKeyword] = React.useState("")
  const [categoryId, setCategoryId] = React.useState(finance.categories[0]?.id || "")
  const [scope, setScope] = React.useState<Scope>("PF")
  const [transactionType, setTransactionType] = React.useState<"income" | "expense" | "transfer" | "any">("expense")
  const [priority, setPriority] = React.useState("80")

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex min-h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        <PlusCircle className="mr-2 h-4 w-4" />Nova regra
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova regra</SheetTitle>
            <SheetDescription>Palavras-chave ajudam a sugerir categoria durante importacoes e lancamentos.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-3">
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Ex.: IFOOD" />
            <Select value={categoryId} onValueChange={(value) => setCategoryId(value || "")}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>{finance.categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={scope} onValueChange={(value) => setScope((value || "PF") as Scope)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent>
            </Select>
            <Select value={transactionType} onValueChange={(value) => setTransactionType((value || "expense") as "income" | "expense" | "transfer" | "any")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Saida</SelectItem>
                <SelectItem value="income">Entrada</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="any">Qualquer</SelectItem>
              </SelectContent>
            </Select>
            <Input value={priority} onChange={(event) => setPriority(event.target.value)} type="number" />
            <Button onClick={() => {
              if (!keyword || !categoryId) return
              level2.addRule({
                keyword,
                category_id: categoryId,
                scope,
                transaction_type: transactionType,
                priority: Number(priority) || 0,
                active: true,
              })
              setOpen(false)
            }}>Salvar regra</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{title}</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{value}</CardContent></Card>
}

function StatusBadge({ status }: { status: ImportedTransactionStatus }) {
  const styles: Record<ImportedTransactionStatus, string> = {
    pending: "border-amber-500 text-amber-600",
    approved: "border-emerald-500 text-emerald-600",
    ignored: "border-muted-foreground text-muted-foreground",
    duplicate: "border-rose-500 text-rose-600",
  }
  return <Badge variant="outline" className={styles[status]}>{status}</Badge>
}
