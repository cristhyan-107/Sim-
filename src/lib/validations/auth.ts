import { z } from "zod"

export const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

export const passwordRules = [
  { id: "length", label: "No minimo 8 caracteres", test: (value: string) => value.length >= 8 },
  { id: "upper", label: "Uma letra maiuscula", test: (value: string) => /[A-Z]/.test(value) },
  { id: "lower", label: "Uma letra minuscula", test: (value: string) => /[a-z]/.test(value) },
  { id: "number", label: "Um numero", test: (value: string) => /\d/.test(value) },
  { id: "special", label: "Um caractere especial", test: (value: string) => /[^A-Za-z\d]/.test(value) },
] as const

export function getPasswordScore(password: string) {
  return passwordRules.filter((rule) => rule.test(password)).length
}

const email = z.string().trim().min(1, "Informe seu e-mail.").email("Informe um e-mail valido.")

const strongPassword = z
  .string()
  .min(1, "Informe sua senha.")
  .regex(strongPasswordRegex, "A senha deve conter letra maiuscula, minuscula, numero e caractere especial.")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha."),
})

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo."),
    email,
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = z.object({
  email,
})

export const resetPasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem.",
    path: ["confirmPassword"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
