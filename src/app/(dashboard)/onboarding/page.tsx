"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, CreditCard, Landmark, ListChecks, WalletCards } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFinance } from "@/lib/finance/store"
import { Scope } from "@/lib/finance/types"
import { successToast, warningToast } from "@/lib/toast"

const steps = ["Conta PF", "Conta PJ", "Cartao PF", "Cartao PJ", "Categorias", "Finalizar"]

export default function OnboardingPage() {
  const finance = useFinance()
  const router = useRouter()
  const [step, setStep] = React.useState(0)
  const [account, setAccount] = React.useState({ name: "Nubank PF", bank: "Nubank", scope: "PF" as Scope, role: "Conta principal PF", initial_balance: 0 })
  const [pjAccount, setPjAccount] = React.useState({ name: "Inter PJ", bank: "Inter", scope: "PJ" as Scope, role: "Conta principal MEI", initial_balance: 0 })
  const [card, setCard] = React.useState({ nickname: "Cartao pessoal", bank: "Nubank", account_id: "", scope: "PF" as Scope, credit_limit: 0, last_four_digits: "", closing_day: 5, due_day: 12 })
  const [pjCard, setPjCard] = React.useState({ nickname: "Cartao PJ", bank: "Inter", account_id: "", scope: "PJ" as Scope, credit_limit: 0, last_four_digits: "", closing_day: 8, due_day: 15 })

  const progress = ((step + 1) / steps.length) * 100
  const pfAccounts = finance.accounts.filter((item) => item.scope === "PF")
  const pjAccounts = finance.accounts.filter((item) => item.scope === "PJ")

  function next() {
    if (step === 0) {
      finance.addAccount(account)
      successToast("Conta PF criada com sucesso.")
    }
    if (step === 1) {
      finance.addAccount(pjAccount)
      successToast("Conta PJ criada com sucesso.")
    }
    if (step === 2) {
      const accountId = card.account_id || pfAccounts[0]?.id || finance.accounts.find((item) => item.scope === "PF")?.id
      if (accountId) {
        finance.addCard({ ...card, account_id: accountId })
        successToast("Cartao pessoal criado como apelido seguro.")
      }
    }
    if (step === 3 && pjCard.nickname) {
      const accountId = pjCard.account_id || pjAccounts[0]?.id || finance.accounts.find((item) => item.scope === "PJ")?.id
      if (accountId) {
        finance.addCard({ ...pjCard, account_id: accountId })
        successToast("Cartao PJ criado como apelido seguro.")
      }
    }
    if (step === steps.length - 1) {
      finance.completeOnboarding()
      successToast("Primeiro acesso concluido.", "Seu dashboard ja pode usar os dados configurados.")
      router.push("/dashboard")
      return
    }
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function skip() {
    finance.skipOnboarding()
    warningToast("Primeiro acesso pulado.", "Voce pode configurar depois, mas o dashboard ficara incompleto.")
    router.push("/dashboard")
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Primeiro acesso</h2>
          <p className="mt-1 text-muted-foreground">Configure a base do seu controle PF/PJ em poucos passos.</p>
        </div>
        <Button variant="outline" onClick={skip}>Pular por enquanto</Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap gap-2">{steps.map((item, index) => <Badge key={item} variant={index === step ? "default" : "outline"}>{index + 1}. {item}</Badge>)}</div>
          <Progress value={progress} />
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {step === 0 && <AccountStep title="Cadastrar conta PF principal" value={account} onChange={setAccount} />}
            {step === 1 && <AccountStep title="Cadastrar conta PJ do MEI" value={pjAccount} onChange={setPjAccount} />}
            {step === 2 && <CardStep title="Cadastrar cartao pessoal por apelido" value={card} onChange={setCard} accounts={finance.accounts.filter((item) => item.scope === "PF")} />}
            {step === 3 && <CardStep title="Cadastrar cartao PJ por apelido" value={pjCard} onChange={setPjCard} accounts={finance.accounts.filter((item) => item.scope === "PJ")} optional />}
            {step === 4 && <CategoriesStep />}
            {step === 5 && <FinishStep />}
            <div className="flex justify-between pt-2">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))}>Voltar</Button>
              <Button onClick={next}>{step === steps.length - 1 ? "Finalizar e ir para Dashboard" : "Avancar"}</Button>
            </div>
          </div>
          <Card className="bg-muted/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="size-4" />Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <Status done={finance.accounts.some((item) => item.scope === "PF")} label="Conta PF configurada" />
              <Status done={finance.accounts.some((item) => item.scope === "PJ")} label="Conta PJ configurada" />
              <Status done={finance.cards.some((item) => item.scope === "PF")} label="Cartao PF por apelido" />
              <Status done={finance.cards.some((item) => item.scope === "PJ")} label="Cartao PJ opcional" />
              <Status done={finance.categories.length > 0} label="Categorias padrao disponiveis" />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

function AccountStep({ title, value, onChange }: { title: string; value: { name: string; bank: string; scope: Scope; role: string; initial_balance: number }; onChange: (value: { name: string; bank: string; scope: Scope; role: string; initial_balance: number }) => void }) {
  return <div className="space-y-4"><h3 className="flex items-center gap-2 text-xl font-semibold"><Landmark className="size-5" />{title}</h3><Field label="Nome"><Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} /></Field><Field label="Banco"><Input value={value.bank} onChange={(e) => onChange({ ...value, bank: e.target.value })} /></Field><Field label="Saldo inicial"><Input type="number" step="0.01" value={value.initial_balance} onChange={(e) => onChange({ ...value, initial_balance: e.target.valueAsNumber || 0 })} /></Field><Field label="Papel"><Input value={value.role} onChange={(e) => onChange({ ...value, role: e.target.value })} /></Field></div>
}

function CardStep({ title, value, onChange, accounts, optional }: { title: string; value: { nickname: string; bank: string; account_id: string; scope: Scope; credit_limit: number; last_four_digits: string; closing_day: number; due_day: number }; onChange: (value: { nickname: string; bank: string; account_id: string; scope: Scope; credit_limit: number; last_four_digits: string; closing_day: number; due_day: number }) => void; accounts: { id: string; name: string }[]; optional?: boolean }) {
  return <div className="space-y-4"><h3 className="flex items-center gap-2 text-xl font-semibold"><CreditCard className="size-5" />{title}{optional && <Badge variant="outline">Opcional</Badge>}</h3><p className="text-sm text-muted-foreground">Informe apenas apelido, banco, limite e ultimos 4 digitos opcionais. Nunca informe numero completo, CVV ou validade.</p><Field label="Apelido"><Input value={value.nickname} onChange={(e) => onChange({ ...value, nickname: e.target.value })} /></Field><Field label="Banco"><Input value={value.bank} onChange={(e) => onChange({ ...value, bank: e.target.value })} /></Field><Field label="Conta vinculada"><Select value={value.account_id} onValueChange={(account_id) => onChange({ ...value, account_id: account_id || "" })}><SelectTrigger><SelectValue placeholder="Selecionar conta" /></SelectTrigger><SelectContent>{accounts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="Limite"><Input type="number" step="0.01" value={value.credit_limit} onChange={(e) => onChange({ ...value, credit_limit: e.target.valueAsNumber || 0 })} /></Field><Field label="Fechamento"><Input type="number" value={value.closing_day} onChange={(e) => onChange({ ...value, closing_day: e.target.valueAsNumber || 1 })} /></Field><Field label="Vencimento"><Input type="number" value={value.due_day} onChange={(e) => onChange({ ...value, due_day: e.target.valueAsNumber || 1 })} /></Field></div></div>
}

function CategoriesStep() {
  return <div className="space-y-4"><h3 className="flex items-center gap-2 text-xl font-semibold"><WalletCards className="size-5" />Confirmar categorias padrao</h3><p className="text-sm leading-6 text-muted-foreground">O Organiza MEI ja vem preparado para separar categorias PF e PJ. Voce pode ajustar tudo depois em Categorias.</p></div>
}

function FinishStep() {
  return <div className="space-y-4"><h3 className="flex items-center gap-2 text-xl font-semibold"><CheckCircle2 className="size-5 text-emerald-600" />Tudo pronto</h3><p className="text-sm leading-6 text-muted-foreground">Finalize para acessar o Dashboard com sua estrutura inicial configurada.</p></div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>
}

function Status({ done, label }: { done: boolean; label: string }) {
  return <div className="flex items-center gap-2"><CheckCircle2 className={done ? "size-4 text-emerald-600" : "size-4 text-muted-foreground"} />{label}</div>
}
