import { AlertTriangle, BookOpen, CreditCard, Landmark, ReceiptText } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sections = [
  ["Como separar PF e PJ", "Use PF para gastos pessoais e PJ para receitas, impostos e custos do MEI. A retirada do dono liga os dois mundos sem misturar categorias."],
  ["Como cadastrar contas", "Cadastre uma conta PF principal e uma conta PJ do MEI. O saldo inicial entra como ponto de partida e os lancamentos atualizam o caixa."],
  ["Como cadastrar cartoes com seguranca", "Crie apenas apelidos como Nubank PF ou Inter PJ. O sistema nunca precisa de numero completo, CVV ou validade."],
  ["Como registrar entrada", "Exemplo: Cliente pagou R$ 1.000 no Inter PJ. Use tipo Entrada, escopo PJ, categoria Receita e conta Inter PJ."],
  ["Como registrar saida", "Exemplo: Canva saiu do Inter PJ ou Mercado saiu do Nubank PF. Use Saida, categoria correta, conta e escopo certo."],
  ["Como registrar retirada do dono", "Use Retirada do dono para sair do Inter PJ e entrar no Nubank PF. Assim o resultado do MEI continua claro."],
  ["Como lancar compra parcelada", "Exemplo: Notebook R$ 1.200 em 6x. O sistema gera as parcelas futuras e coloca cada uma na fatura do cartao."],
  ["Como pagar fatura", "Abra Faturas, escolha a fatura e marque como paga. A saida sera registrada na conta escolhida."],
  ["Como criar recorrencia", "Use recorrencias para DAS, ChatGPT, Canva, Internet, celular e assinaturas mensais."],
  ["Como fazer fechamento mensal", "No fim do mes, revise entradas, saidas, faturas, DAS, retiradas e marque o mes como revisado."],
  ["Como usar orcamento", "Defina limites por categoria. O sistema mostra percentuais usados e alertas quando passar de 80%, 90% ou 100%."],
  ["Como exportar dados", "Use Configuracoes ou Relatorios para exportar CSV de lancamentos, faturas, parcelados, fechamento ou backup completo."],
]

export default function HelpPage() {
  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Como usar o Organiza MEI</h2>
        <p className="mt-1 text-muted-foreground">Guia pratico para operar o sistema sem misturar vida pessoal e empresa.</p>
      </div>

      <Alert>
        <AlertTriangle className="size-4" />
        <AlertDescription>Nunca informe numero completo do cartao, CVV, validade, senha bancaria, token ou foto do cartao. O sistema usa apenas apelidos para controle financeiro.</AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-3">
        <GuideCard icon={Landmark} title="PF x PJ" text="Contas, categorias, lancamentos e relatorios sempre indicam escopo PF ou PJ." />
        <GuideCard icon={CreditCard} title="Cartoes seguros" text="Cartao e apenas apelido de controle. Faturas sao calculadas por compras e parcelas." />
        <GuideCard icon={ReceiptText} title="Fechamento mensal" text="Revise o mes, acompanhe DAS, retiradas, orcamento e caixa final." />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([title, text], index) => (
          <Card key={title}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="size-4" />{index + 1}. {title}</CardTitle></CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">{text}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function GuideCard({ icon: Icon, title, text }: { icon: typeof Landmark; title: string; text: string }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Icon className="size-5" />{title}</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">{text}</CardContent></Card>
}
