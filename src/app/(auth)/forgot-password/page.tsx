import { AuthCard } from "@/components/auth/auth-card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      eyebrow="Recuperacao"
      title="Redefinir acesso"
      subtitle="Informe seu e-mail e enviaremos um link seguro para criar uma nova senha."
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
