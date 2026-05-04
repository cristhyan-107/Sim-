import { AuthCard } from "@/components/auth/auth-card"
import { SignUpForm } from "@/components/auth/sign-up-form"

export default function SignUpPage() {
  return (
    <AuthCard
      eyebrow="Criar conta"
      title="Comece com uma conta segura"
      subtitle="Crie seu acesso privado. Depois confirme o e-mail para liberar o login."
    >
      <SignUpForm />
    </AuthCard>
  )
}
