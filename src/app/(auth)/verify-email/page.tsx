import { AuthCard } from "@/components/auth/auth-card"
import { VerifyEmailActions } from "@/components/auth/verify-email-actions"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams

  return (
    <AuthCard
      eyebrow="Confirmacao"
      title="Verifique seu e-mail"
      subtitle="A confirmacao protege sua conta e evita acessos indevidos ao painel financeiro."
    >
      <VerifyEmailActions email={params.email} />
    </AuthCard>
  )
}
