"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { friendlyAuthError, getAuthRedirectUrl } from "@/lib/auth/errors"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth"

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [sentTo, setSentTo] = React.useState("")
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  })

  async function onSubmit(values: ForgotPasswordInput) {
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: getAuthRedirectUrl("/auth/callback?next=/reset-password"),
    })

    setIsLoading(false)

    if (error) {
      const message = friendlyAuthError(error.message)
      toast.error(message)
      form.setError("root", { message })
      return
    }

    setSentTo(values.email)
    toast.success("Enviamos um link para redefinicao de senha.")
  }

  if (sentTo) {
    return (
      <div className="space-y-5">
        <Alert>
          <AlertDescription>
            Enviamos um link de recuperacao para <strong>{sentTo}</strong>. Verifique sua caixa de entrada e spam.
          </AlertDescription>
        </Alert>
        <Link className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-11 w-full")} href="/login">
          Voltar para login
        </Link>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        {form.formState.errors.root?.message && (
          <Alert variant="destructive">
            <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="h-11 pl-9" placeholder="voce@email.com" type="email" autoComplete="email" {...field} />
                </div>
              </FormControl>
              <FormDescription>Voce recebera um link seguro para criar uma nova senha.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="h-11 w-full" type="submit" disabled={!form.formState.isValid || isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Enviar link de recuperacao
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Voltar para login
          </Link>
        </p>
      </form>
    </Form>
  )
}
