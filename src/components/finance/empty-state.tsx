import Link from "next/link"
import { LucideIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  secondaryLabel?: string
  secondaryHref?: string
  onSecondary?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  onSecondary,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl border bg-background shadow-sm">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {(actionLabel || secondaryLabel) && (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {actionLabel && actionHref && <Link className={cn(buttonVariants({ size: "lg" }), "h-10")} href={actionHref}>{actionLabel}</Link>}
            {actionLabel && onAction && <Button className="h-10" onClick={onAction}>{actionLabel}</Button>}
            {secondaryLabel && secondaryHref && <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10")} href={secondaryHref}>{secondaryLabel}</Link>}
            {secondaryLabel && onSecondary && <Button className="h-10" variant="outline" onClick={onSecondary}>{secondaryLabel}</Button>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
