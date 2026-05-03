"use client";

import * as React from "react";
import { PlusCircle, Search, MoreHorizontal, Tags, CheckCircle2, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from "lucide-react";
import { MOCK_CATEGORIES } from "@/data/mock-data";

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

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [scopeFilter, setScopeFilter] = React.useState("ALL");

  const filteredCategories = MOCK_CATEGORIES.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (scopeFilter === "ALL" || cat.scope === scopeFilter)
  );

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Categoria criada com sucesso!", {
      description: "Ela já aparecerá nos seus lançamentos.",
    });
    setIsDialogOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income":
        return <ArrowUpCircle className="h-4 w-4 text-emerald-500 mr-2" />;
      case "expense":
        return <ArrowDownCircle className="h-4 w-4 text-rose-500 mr-2" />;
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4 text-amber-500 mr-2" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "income":
        return "Entrada";
      case "expense":
        return "Saída";
      case "transfer":
        return "Transferência";
      default:
        return type;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categorias</h2>
          <p className="text-muted-foreground mt-1">Classifique suas receitas e despesas.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateCategory}>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogDescription>
                  Crie uma nova tag para classificar seus lançamentos.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Categoria</Label>
                  <Input id="name" placeholder="Ex: Combustível, Tráfego Pago..." required />
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
                    <Label htmlFor="type">Tipo</Label>
                    <Select defaultValue="expense">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Entrada (Receita)</SelectItem>
                        <SelectItem value="expense">Saída (Despesa)</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Categoria</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Todas as Categorias
          </CardTitle>
          <CardDescription>
            Lista de todas as categorias ativas no sistema.
          </CardDescription>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar categorias..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={scopeFilter} onValueChange={(val) => setScopeFilter(val || "ALL")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Escopo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Escopos</SelectItem>
                <SelectItem value="PF">Apenas PF</SelectItem>
                <SelectItem value="PJ">Apenas PJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Natureza</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      Nenhuma categoria encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            category.scope === "PF"
                              ? "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                          }
                        >
                          {category.scope}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getTypeIcon(category.type)}
                          <span className="capitalize">{getTypeLabel(category.type)}</span>
                        </div>
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
                              Editar categoria
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Inativar categoria
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
