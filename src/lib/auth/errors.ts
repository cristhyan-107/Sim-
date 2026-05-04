export function friendlyAuthError(message?: string) {
  const normalized = (message || "").toLowerCase()

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos."
  }

  if (normalized.includes("email not confirmed")) {
    return "Sua conta ainda nao foi confirmada. Verifique seu e-mail antes de entrar."
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "Ja existe uma conta com este e-mail."
  }

  if (normalized.includes("password")) {
    return "A senha informada nao atende aos criterios de seguranca."
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."
  }

  if (normalized.includes("token") || normalized.includes("expired")) {
    return "O link expirou ou nao e mais valido. Solicite um novo link."
  }

  return "Nao foi possivel concluir a acao agora. Tente novamente."
}

export function getAuthRedirectUrl(path: string) {
  if (typeof window === "undefined") {
    return path
  }

  return `${window.location.origin}${path}`
}
