"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2, MailCheck } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { friendlyAuthError, getAuthRedirectUrl } from "@/lib/auth/errors"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function VerifyEmailActions({ email }: { email?: string }) {
  const [isLoading, setIsLoading] = React.useState(false)

  async function resend() {
    if (!email) {
      toast.error("Informe novamente seu e-mail na tela de cadastro para reenviar a confirmacao.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl("/auth/callback?next=/login?confirmed=1"),
      },
    })
    setIsLoading(false)

    if (error) {
      toast.error(friendlyAuthError(error.message))
      return
    }

    toast.success("E-mail de confirmacao reenviado.")
  }

  return (
    <div className="space-y-5">
      <Alert>
        <MailCheck className="size-4" />
        <AlertDescription>
          Enviamos um e-mail de confirmacao{email ? <> para <strong>{email}</strong></> : null}. Verifique sua caixa de entrada e spam.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button className="h-11" onClick={resend} disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Reenviar e-mail
        </Button>
        <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")} href="/login">
          Voltar para login
        </Link>
      </div>
    </div>
  )
}
