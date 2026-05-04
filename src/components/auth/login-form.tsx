"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { PasswordInput } from "@/components/auth/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { friendlyAuthError } from "@/lib/auth/errors"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  })

  const statusMessage = getStatusMessage(searchParams)

  async function onSubmit(values: LoginInput) {
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    setIsLoading(false)

    if (error) {
      const message = friendlyAuthError(error.message)
      toast.error(message)
      form.setError("root", { message })
      return
    }

    toast.success("Login realizado com sucesso.")
    router.replace("/dashboard")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        {statusMessage && (
          <Alert variant={statusMessage.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{statusMessage.message}</AlertDescription>
          </Alert>
        )}

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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-3">
                <FormLabel>Senha</FormLabel>
                <Link href="/forgot-password" className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <FormControl>
                <PasswordInput autoComplete="current-password" placeholder="Sua senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="h-11 w-full" type="submit" disabled={!form.formState.isValid || isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Entrar
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Ainda nao tem conta?{" "}
          <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </Form>
  )
}

function getStatusMessage(searchParams: ReturnType<typeof useSearchParams>) {
  if (searchParams.get("confirmed") === "1") {
    return { type: "success" as const, message: "Conta confirmada com sucesso. Agora voce ja pode entrar." }
  }

  if (searchParams.get("reset") === "success") {
    return { type: "success" as const, message: "Senha redefinida com sucesso. Entre com sua nova senha." }
  }

  if (searchParams.get("error") === "callback") {
    return { type: "error" as const, message: "Nao foi possivel validar o link. Solicite um novo e tente novamente." }
  }

  return null
}
