"use client";

import * as React from "react";
import { PlusCircle, Search, MoreHorizontal, Landmark, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MOCK_ACCOUNTS } from "@/data/mock-data";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function AccountsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const filteredAccounts = MOCK_ACCOUNTS.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Conta criada com sucesso!", {
      description: "A conta bancária foi cadastrada (Mock mode).",
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contas Bancárias</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas contas de Pessoa Física e Jurídica.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateAccount}>
              <DialogHeader>
                <DialogTitle>Nova Conta Bancária</DialogTitle>
                <DialogDescription>
                  Adicione uma nova conta para controle financeiro.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Conta</Label>
                  <Input id="name" placeholder="Ex: Nubank Principal" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bank">Instituição Financeira</Label>
                  <Input id="bank" placeholder="Ex: Nubank, Itaú, Inter..." required />
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
                    <Label htmlFor="initial_balance">Saldo Inicial</Label>
                    <Input id="initial_balance" type="number" step="0.01" defaultValue="0" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Conta</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Total em Contas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                MOCK_ACCOUNTS.reduce((acc, curr) => acc + curr.current_balance, 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Landmark className="h-4 w-4" />
              Saldo Contas PF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                MOCK_ACCOUNTS.filter((a) => a.scope === "PF").reduce(
                  (acc, curr) => acc + curr.current_balance,
                  0
                )
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Landmark className="h-4 w-4" />
              Saldo Contas PJ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                MOCK_ACCOUNTS.filter((a) => a.scope === "PJ").reduce(
                  (acc, curr) => acc + curr.current_balance,
                  0
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Contas</CardTitle>
          <CardDescription>
            Todas as suas contas ativas e inativas.
          </CardDescription>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar contas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Conta</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Saldo Atual</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nenhuma conta encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{account.name}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {account.role}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{account.bank}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            account.scope === "PF"
                              ? "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                          }
                        >
                          {account.scope}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {account.status === "active" ? (
                          <div className="flex items-center text-emerald-500 text-sm">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Ativa
                          </div>
                        ) : (
                          <div className="flex items-center text-muted-foreground text-sm">
                            <XCircle className="mr-1 h-4 w-4" />
                            Inativa
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(account.current_balance)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => toast.info("Funcionalidade de edição em breve.")}>
                              Editar conta
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Inativar conta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
