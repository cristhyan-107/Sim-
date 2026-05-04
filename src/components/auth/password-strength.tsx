"use client"

import { CheckCircle2, Circle } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { getPasswordScore, passwordRules } from "@/lib/validations/auth"
import { cn } from "@/lib/utils"

export function PasswordStrength({ password }: { password: string }) {
  const score = getPasswordScore(password)
  const percent = (score / passwordRules.length) * 100
  const label = score <= 2 ? "Fraca" : score === 3 || score === 4 ? "Boa" : "Forte"

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Forca da senha</span>
        <span className={cn("font-semibold", score === 5 ? "text-emerald-600" : score >= 3 ? "text-amber-600" : "text-muted-foreground")}>
          {label}
        </span>
      </div>
      <Progress value={percent} className="h-1.5" />
      <div className="grid gap-2">
        {passwordRules.map((rule) => {
          const valid = rule.test(password)
          const Icon = valid ? CheckCircle2 : Circle
          return (
            <div key={rule.id} className={cn("flex items-center gap-2 text-xs", valid ? "text-emerald-600" : "text-muted-foreground")}>
              <Icon className="size-3.5" />
              <span>{rule.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
