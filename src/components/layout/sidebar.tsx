"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
  CreditCard,
  CircleHelp,
  FileUp,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  BadgeDollarSign,
  Receipt,
  Repeat,
  Settings,
  Tags,
  Target,
  Calculator,
  WalletCards,
} from "lucide-react"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contas", href: "/accounts", icon: Landmark },
  { name: "Cartoes", href: "/cards", icon: CreditCard },
  { name: "Contas & Cartoes", href: "/accounts-cards", icon: WalletCards },
  { name: "Categorias", href: "/categories", icon: Tags },
  { name: "Lancamentos", href: "/transactions", icon: ArrowRightLeft },
  { name: "Parcelados", href: "/installments", icon: Receipt },
  { name: "Faturas", href: "/invoices", icon: Receipt },
  { name: "Recorrencias", href: "/recurrences", icon: Repeat },
  { name: "Calendario", href: "/calendar", icon: CalendarDays },
  { name: "Orcamento", href: "/budgets", icon: Target },
  { name: "Fechamento", href: "/monthly-closing", icon: BarChart3 },
  { name: "Relatorios", href: "/reports", icon: BarChart3 },
  { name: "Importacoes", href: "/imports", icon: FileUp },
  { name: "Painel MEI", href: "/mei", icon: BadgeDollarSign },
  { name: "DAS", href: "/das", icon: Receipt },
  { name: "Simulador", href: "/simulator", icon: Calculator },
  { name: "Metas e Reservas", href: "/goals", icon: Target },
  { name: "Ajuda", href: "/help", icon: CircleHelp },
]

export function Sidebar() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
        <Brand />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon" />}>
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] overflow-y-auto p-0">
            <SheetHeader className="border-b p-4">
              <SheetTitle><Brand /></SheetTitle>
            </SheetHeader>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r bg-background px-4 py-6 md:flex">
        <Brand className="mb-8 px-2" />
        <SidebarContent />
      </aside>
    </>
  )
}

function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Landmark className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold tracking-tight">Organiza MEI</span>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  async function handleLogout() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      window.location.href = "/login"
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col p-4 md:min-h-0 md:flex-1 md:p-0">
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 border-t pt-4">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Configuracoes
        </Link>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  )
}
