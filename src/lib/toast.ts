import { toast } from "sonner"

export function successToast(message: string, description?: string) {
  toast.success(message, { description })
}

export function errorToast(message = "Nao foi possivel salvar. Verifique os campos e tente novamente.", description?: string) {
  toast.error(message, { description })
}

export function warningToast(message: string, description?: string) {
  toast.warning(message, { description })
}

export function infoToast(message: string, description?: string) {
  toast.info(message, { description })
}
