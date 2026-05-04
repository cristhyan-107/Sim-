"use client"

import * as React from "react"
import { Landmark, ShieldCheck, TrendingUp } from "lucide-react"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AuthCardProps = {
  eyebrow?: string
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthCard({ eyebrow, title, subtitle, children, footer, className }: AuthCardProps) {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.18]" />
      <div className="absolute inset-x-0 top-0 h-24 border-b bg-background/80 backdrop-blur-xl" />

      <section className="relative z-10 grid w-full grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,560px)]">
        <div className="hidden min-h-screen flex-col justify-between border-r px-10 py-9 lg:flex xl:px-14">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border bg-card shadow-sm">
              <Landmark className="size-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Organiza MEI</div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Financeiro privado</div>
            </div>
          </div>

          <div className="max-w-xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              Acesso seguro com Supabase Auth
            </div>
            <div className="space-y-4">
              <h1 className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-tight xl:text-6xl">
                Controle financeiro pessoal e MEI em um ambiente privado.
              </h1>
              <p className="max-w-md text-base leading-7 text-muted-foreground">
                Entre para acompanhar contas, cartoes, faturas, recorrencias, orcamentos e fechamento mensal com a mesma experiencia premium do painel.
              </p>
            </div>
            <div className="grid max-w-lg grid-cols-3 gap-3">
              {[
                ["PF/PJ", "escopos separados"],
                ["RLS", "dados por usuario"],
                ["Cartoes", "sem dados sensiveis"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-card/70 p-4 shadow-sm backdrop-blur">
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" />
            Autenticacao, confirmacao de e-mail e recuperacao de senha.
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-5 flex items-center justify-between lg:justify-end">
              <div className="flex items-center gap-2 lg:hidden">
                <div className="flex size-10 items-center justify-center rounded-xl border bg-card shadow-sm">
                  <Landmark className="size-5" />
                </div>
                <div className="font-semibold tracking-tight">Organiza MEI</div>
              </div>
              <ThemeToggle />
            </div>

            <Card className={cn("border bg-card/95 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl dark:shadow-black/35 sm:p-7", className)}>
              <div className="mb-6 space-y-2">
                {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>}
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              {children}
              {footer && <div className="mt-6 border-t pt-5">{footer}</div>}
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
