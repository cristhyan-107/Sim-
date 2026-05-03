'use client'

import { useState } from 'react'
import { Plus, Building2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const DUMMY_ACCOUNTS = [
  { id: '1', name: 'Nubank PF', bank: 'Nubank', scope: 'PF', balance: 2500.00, status: 'active' },
  { id: '2', name: 'Inter PJ', bank: 'Inter', scope: 'PJ', balance: 14250.00, status: 'active' },
  { id: '3', name: 'Itaú PF Backup', bank: 'Itaú', scope: 'PF', balance: 300.00, status: 'secondary' },
]

export default function AccountsPage() {
  const [accounts] = useState(DUMMY_ACCOUNTS)

  const pfBalance = accounts.filter(a => a.scope === 'PF').reduce((acc, a) => acc + a.balance, 0)
  const pjBalance = accounts.filter(a => a.scope === 'PJ').reduce((acc, a) => acc + a.balance, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas contas de Pessoa Física e Jurídica.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total PF</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pfBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total PJ</CardTitle>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pjBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minhas Contas</CardTitle>
          <CardDescription>Lista de todas as contas vinculadas ao seu controle.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Conta</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Saldo Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>{account.bank}</TableCell>
                  <TableCell>
                    <Badge variant={account.scope === 'PF' ? 'default' : 'secondary'} className={account.scope === 'PF' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}>
                      {account.scope}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={account.status === 'active' ? 'border-green-500 text-green-600' : 'border-muted-foreground text-muted-foreground'}>
                      {account.status === 'active' ? 'Ativa' : 'Secundária'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
