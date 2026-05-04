import { AuthCard } from "@/components/auth/auth-card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <AuthCard
      eyebrow="Nova senha"
      title="Crie uma nova senha"
      subtitle="Use uma senha forte para proteger seus dados financeiros pessoais e empresariais."
    >
      <ResetPasswordForm />
    </AuthCard>
  )
}
