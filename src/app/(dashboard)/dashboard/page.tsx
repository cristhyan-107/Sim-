"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_SUMMARY, MOCK_TRANSACTIONS, MOCK_ALERTS } from "@/data/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, AlertCircle, Building2, UserCircle2 } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const data = [
  { name: "Jan", Entradas: 4000, Saidas: 2400 },
  { name: "Fev", Entradas: 3000, Saidas: 1398 },
  { name: "Mar", Entradas: 2000, Saidas: 9800 },
  { name: "Abr", Entradas: 2780, Saidas: 3908 },
  { name: "Mai", Entradas: 1890, Saidas: 4800 },
  { name: "Jun", Entradas: 5500, Saidas: 1425 },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* PF Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <UserCircle2 className="h-4 w-4" />
              Saldo Total PF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(MOCK_SUMMARY.pf.total_balance)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        {/* PJ Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-4 w-4" />
              Saldo Total PJ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(MOCK_SUMMARY.pj.total_balance)}</div>
            <p className="text-xs text-muted-foreground">
              +15% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Entradas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas do Mês (MEI)</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(MOCK_SUMMARY.pj.income_month)}</div>
          </CardContent>
        </Card>

        {/* Saídas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas do Mês (MEI)</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(MOCK_SUMMARY.pj.expense_month)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Entradas vs Saídas</CardTitle>
            <CardDescription>
              Fluxo de caixa dos últimos 6 meses (Visão PJ).
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Últimos Lançamentos</CardTitle>
            <CardDescription>
              Suas movimentações mais recentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {MOCK_TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${tx.scope === 'PF' ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/20'}`}>
                    {tx.type === 'income' ? (
                      <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
                    ) : tx.type === 'expense' ? (
                      <ArrowDownIcon className="h-4 w-4 text-rose-500" />
                    ) : (
                      <ArrowRightLeft className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.date)} • {tx.scope}
                    </p>
                  </div>
                  <div className={`ml-auto font-medium ${tx.type === 'income' ? 'text-emerald-500' : tx.type === 'expense' ? 'text-foreground' : 'text-amber-500'}`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Alertas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {MOCK_ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-4 rounded-md border p-4"
              >
                <AlertCircle className={`h-5 w-5 ${alert.type === 'destructive' ? 'text-destructive' : 'text-amber-500'}`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {alert.message}
                  </p>
                </div>
                <Badge variant="outline" className={alert.scope === 'PF' ? 'border-blue-500 text-blue-500' : 'border-emerald-500 text-emerald-500'}>{alert.scope}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
