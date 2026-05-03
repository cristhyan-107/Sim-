"use client";

import * as React from "react";
import { PlusCircle, Search, CreditCard, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MOCK_CARDS, MOCK_ACCOUNTS } from "@/data/mock-data";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CardsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const filteredCards = MOCK_CARDS.filter(
    (card) =>
      card.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Cartão cadastrado com sucesso!", {
      description: "As faturas já podem ser gerenciadas neste cartão.",
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cartões de Crédito</h2>
          <p className="text-muted-foreground mt-1">Gerencie os cartões usados pela empresa e pessoais.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateCard}>
              <DialogHeader>
                <DialogTitle>Novo Cartão</DialogTitle>
                <DialogDescription>
                  Cadastre um cartão para gerenciar suas compras e faturas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Alert variant="destructive" className="bg-destructive/10 text-destructive border-none">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Aviso de Segurança</AlertTitle>
                  <AlertDescription className="text-xs">
                    Nunca informe o número completo, código CVV ou senha do seu cartão. O sistema pede apenas um apelido para organização financeira.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-2">
                  <Label htmlFor="nickname">Apelido do Cartão</Label>
                  <Input id="nickname" placeholder="Ex: Nubank Principal" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bank">Banco Emissor</Label>
                    <Input id="bank" placeholder="Ex: Nubank" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_four_digits">Últimos 4 Dígitos</Label>
                    <Input id="last_four_digits" placeholder="Ex: 1234" maxLength={4} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="scope">Escopo</Label>
                    <Select defaultValue="PF">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">PF (Pessoal)</SelectItem>
                        <SelectItem value="PJ">PJ (Empresa)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account_id">Conta de Pagamento</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_ACCOUNTS.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="closing_day">Dia de Fechamento</Label>
                    <Input id="closing_day" type="number" min="1" max="31" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="due_day">Dia de Vencimento</Label>
                    <Input id="due_day" type="number" min="1" max="31" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit_limit">Limite Total (Opcional)</Label>
                  <Input id="credit_limit" type="number" step="0.01" placeholder="Ex: 5000.00" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Cadastrar Cartão</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar cartões..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCards.length === 0 ? (
          <div className="col-span-full text-center p-12 border rounded-lg border-dashed text-muted-foreground">
            Nenhum cartão encontrado.
          </div>
        ) : (
          filteredCards.map((card) => (
            <Card key={card.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${card.scope === 'PF' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {card.nickname}
                    </CardTitle>
                    <CardDescription className="mt-1">{card.bank}</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      card.scope === "PF"
                        ? "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                    }
                  >
                    {card.scope}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Final do Cartão</span>
                    <span className="font-mono">{card.last_four_digits || '****'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fechamento</span>
                    <span>Dia {card.closing_day}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vencimento</span>
                    <span>Dia {card.due_day}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3">
                    <span className="text-muted-foreground">Limite Total</span>
                    <span className="font-medium">{card.credit_limit ? formatCurrency(card.credit_limit) : 'Não informado'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/50 flex gap-2">
                <Button variant="outline" className="w-full" onClick={() => toast.info('Redirecionando para faturas...')}>Faturas</Button>
                <Button variant="outline" className="w-full">Editar</Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
