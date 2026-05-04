"use client"

import * as React from "react"
import { CheckCircle2, Database, Download, Moon, PlayCircle, RotateCcw, ShieldAlert, Sun, Trash2, User, Monitor } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { csvRows, datedName, downloadCsv } from "@/lib/csv"
import { getMonthlyClosingSnapshot } from "@/lib/finance/engine"
import { useFinance } from "@/lib/finance/store"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const finance = useFinance()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [profile, setProfile] = React.useState({ name: "Cristian", email: "usuario@organiza-mei.local", type: "MEI individual" })
  const [preferences, setPreferences] = React.useState({
    currency: "BRL",
    dateFormat: "dd/MM/yyyy",
    defaultMonth: new Date().toISOString().slice(0, 7),
    defaultPfAccount: finance.accounts.find((item) => item.scope === "PF")?.id || "",
    defaultPjAccount: finance.accounts.find((item) => item.scope === "PJ")?.id || "",
  })

  function saveSettings() {
    toast.success("Configuracoes locais salvas para esta sessao.")
  }

  function exportAll() {
    downloadCsv(datedName("backup-organiza-mei"), [
      ...csvRows.accounts(finance).map((item) => ({ grupo: "contas", ...item })),
      ...csvRows.cards(finance).map((item) => ({ grupo: "cartoes", ...item })),
      ...csvRows.categories(finance).map((item) => ({ grupo: "categorias", ...item })),
      ...csvRows.transactions(finance).map((item) => ({ grupo: "lancamentos", ...item })),
      ...csvRows.installments(finance).map((item) => ({ grupo: "parcelados", ...item })),
      ...csvRows.invoices(finance).map((item) => ({ grupo: "faturas", ...item })),
      ...csvRows.recurrences(finance).map((item) => ({ grupo: "recorrencias", ...item })),
      ...csvRows.budgets(finance).map((item) => ({ grupo: "orcamentos", ...item })),
    ])
  }

  const month = preferences.defaultMonth
  const closing = getMonthlyClosingSnapshot(finance, `${month}-01`)

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuracoes</h2>
        <p className="mt-1 text-muted-foreground">Perfil, preferencias, tema, seguranca, exportacao e status do ambiente.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Perfil</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label>Nome</Label><Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></div>
            <div className="grid gap-2"><Label>E-mail</Label><Input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></div>
            <div className="grid gap-2"><Label>Tipo de usuario</Label><Input value={profile.type} onChange={(event) => setProfile({ ...profile, type: event.target.value })} /></div>
            <Alert><CheckCircle2 className="h-4 w-4" /><AlertTitle>Uso individual</AlertTitle><AlertDescription>Esta versao foi desenhada para controle financeiro individual de MEI.</AlertDescription></Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Preferencias</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label>Moeda padrao</Label><Input value={preferences.currency} readOnly /></div>
            <div className="grid gap-2"><Label>Formato de data</Label><Input value={preferences.dateFormat} readOnly /></div>
            <div className="grid gap-2"><Label>Mes padrao</Label><Input type="month" value={preferences.defaultMonth} onChange={(event) => setPreferences({ ...preferences, defaultMonth: event.target.value })} /></div>
            <div className="grid gap-2"><Label>Conta padrao PF</Label><AccountSelect value={preferences.defaultPfAccount} onChange={(value) => setPreferences({ ...preferences, defaultPfAccount: value })} scope="PF" /></div>
            <div className="grid gap-2"><Label>Conta padrao PJ</Label><AccountSelect value={preferences.defaultPjAccount} onChange={(value) => setPreferences({ ...preferences, defaultPjAccount: value })} scope="PJ" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tema</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}><Sun className="mr-2 h-4 w-4" />Claro</Button>
            <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}><Moon className="mr-2 h-4 w-4" />Escuro</Button>
            <Button variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")}><Monitor className="mr-2 h-4 w-4" />Sistema</Button>
            <p className="text-sm text-muted-foreground sm:col-span-3">Tema resolvido agora: <strong>{resolvedTheme || "sistema"}</strong></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-500" />Seguranca</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              "O sistema nao armazena numero completo de cartao.",
              "O sistema nao pede CVV, validade, senha bancaria ou login bancario.",
              "Open Finance nao esta implementado nesta versao.",
              "Cartoes sao apenas apelidos de controle com banco, limite e ultimos 4 digitos opcionais.",
              "Nao informe fotos de cartao ou dados bancarios sensiveis em observacoes.",
            ].map((item) => <Alert key={item}><ShieldAlert className="h-4 w-4" /><AlertDescription>{item}</AlertDescription></Alert>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Dados e exportacao</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Button variant="outline" onClick={exportAll}>Todos os dados CSV</Button>
          <Button variant="outline" onClick={() => downloadCsv(datedName("lancamentos"), csvRows.transactions(finance))}>Lancamentos CSV</Button>
          <Button variant="outline" onClick={() => downloadCsv(datedName("faturas"), csvRows.invoices(finance))}>Faturas CSV</Button>
          <Button variant="outline" onClick={() => downloadCsv(datedName("parcelados"), csvRows.installments(finance))}>Parcelados CSV</Button>
          <Button variant="outline" onClick={() => downloadCsv(`fechamento-${month}.csv`, [{ mes: month, ...closing }])}>Fechamento CSV</Button>
          <Button variant="outline" onClick={() => downloadCsv(datedName("dados-pf"), csvRows.transactions(finance).filter((item) => item.escopo === "PF"))}>Dados PF CSV</Button>
          <Button variant="outline" onClick={() => downloadCsv(datedName("dados-pj"), csvRows.transactions(finance).filter((item) => item.escopo === "PJ"))}>Dados PJ CSV</Button>
          <Button variant="outline" onClick={finance.populateExampleData}><PlayCircle className="mr-2 h-4 w-4" />Popular dados de exemplo</Button>
          <Button variant="outline" onClick={finance.clearExampleData}><Trash2 className="mr-2 h-4 w-4" />Limpar dados de exemplo</Button>
          <Button variant="outline" onClick={finance.reopenOnboarding}><RotateCcw className="mr-2 h-4 w-4" />Reabrir primeiro acesso</Button>
          <Link className={cn(buttonVariants({ variant: "outline" }), "h-8")} href="/onboarding">Abrir onboarding</Link>
          <Button variant="destructive" onClick={finance.clearAllData}><Trash2 className="mr-2 h-4 w-4" />Limpar todos os dados</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Sistema</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Status label="Versao" value="0.1.0 - Fase 5" />
            <Status label="Backend" value={finance.isSupabaseConnected ? "Supabase conectado" : "Mock/local sem sessao Supabase"} />
            <Status label="Modo escuro" value="Ativo via next-themes" />
            <Status label="Validacoes" value="React Hook Form + Zod" />
            <Status label="Seguranca cartoes" value="Sem dados sensiveis" />
            <Status label="Supabase" value="Auth, repositorio e SQL com RLS" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mock data / ambiente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea readOnly rows={7} value={`Ambiente atual: ${finance.isSupabaseConnected ? "Supabase/PostgreSQL autenticado" : "mock/local state sem sessao Supabase"}\nTabelas: profiles, accounts, cards, categories, transactions, installment_purchases, installments, invoices, recurrences, budgets, monthly_closings, audit_logs\nRLS: ativo via sql/rls.sql\nPersistencia: store financeiro sincroniza com Supabase quando ha sessao autenticada.`} />
            <Button onClick={saveSettings}>Salvar preferencias locais</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  function AccountSelect({ value, onChange, scope }: { value: string; onChange: (value: string) => void; scope: "PF" | "PJ" }) {
    return <Select value={value} onValueChange={(next) => onChange(next || "")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{finance.accounts.filter((item) => item.scope === scope).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
  }
}

function Status({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 flex items-center gap-2 text-sm font-medium"><Badge className="bg-emerald-600">OK</Badge>{value}</div></div>
}
