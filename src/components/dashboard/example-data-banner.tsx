"use client"

import * as React from "react"
import { AlertTriangle, CircleOff, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type ExampleDataBannerProps = {
  hasExampleData: boolean
  loading?: boolean
  onClearExampleData: () => Promise<boolean>
  onDismiss?: () => void
}

export function ExampleDataBanner({ hasExampleData, loading, onClearExampleData, onDismiss }: ExampleDataBannerProps) {
  const [open, setOpen] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)

  if (!hasExampleData || dismissed) return null

  async function confirmClear() {
    const success = await onClearExampleData()
    if (success) setOpen(false)
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/90 p-4 shadow-sm backdrop-blur",
        "dark:bg-card/70"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 items-center justify-center rounded-full border bg-background">
            <Info className="size-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-muted-foreground" />
              <h3 className="text-base font-semibold tracking-tight">Voce esta visualizando dados de exemplo</h3>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Esses dados servem apenas para demonstracao. Limpe os exemplos antes de comecar a usar o Organiza MEI com seus dados reais.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button size="sm" onClick={() => setOpen(true)} disabled={loading}>
            <CircleOff className="mr-2 size-4" />
            Limpar dados de exemplo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDismissed(true)
              onDismiss?.()
            }}
          >
            Manter por enquanto
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar dados de exemplo?</DialogTitle>
            <DialogDescription>
              Isso removera apenas os dados de exemplo. Seus dados reais serao preservados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmClear} disabled={loading}>
              {loading ? "Limpando..." : "Sim, limpar dados de exemplo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
