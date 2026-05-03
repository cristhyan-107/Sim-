'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Landmark, 
  CreditCard, 
  ArrowRightLeft, 
  CalendarDays, 
  Receipt, 
  Repeat, 
  Target, 
  BarChart3, 
  Settings,
  LogOut,
  Tags
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Contas', href: '/accounts', icon: Landmark },
  { name: 'Cartões', href: '/cards', icon: CreditCard },
  { name: 'Categorias', href: '/categories', icon: Tags },
  { name: 'Lançamentos', href: '/transactions', icon: ArrowRightLeft },
  { name: 'Parcelados', href: '/installments', icon: Receipt },
  { name: 'Faturas', href: '/invoices', icon: Receipt },
  { name: 'Recorrências', href: '/recurrences', icon: Repeat },
  { name: 'Calendário', href: '/calendar', icon: CalendarDays },
  { name: 'Orçamento', href: '/budgets', icon: Target },
  { name: 'Fechamento', href: '/monthly-closing', icon: BarChart3 },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r bg-background px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Landmark className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">Organiza MEI</span>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-secondary text-secondary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t pt-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === '/settings'
              ? "bg-secondary text-secondary-foreground" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
        <button
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
