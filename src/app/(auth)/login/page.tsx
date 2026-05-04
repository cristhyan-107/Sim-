import * as React from "react"

import { AuthCard } from "@/components/auth/auth-card"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="Acesso"
      title="Entrar no Organiza MEI"
      subtitle="Acesse seu painel financeiro privado com seguranca e continue de onde parou."
    >
      <React.Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
        <LoginForm />
      </React.Suspense>
    </AuthCard>
  )
}
