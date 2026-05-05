import { FinanceState } from "@/lib/finance/types"
import { Level2State } from "@/lib/level2/types"

export type BackupPayload = {
  version: 1
  exported_at: string
  finance: FinanceState
  level2: Level2State
}

export function createBackupPayload(finance: FinanceState, level2: Level2State): BackupPayload {
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    finance,
    level2,
  }
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function restoreBackupPayload(input: string) {
  const parsed = JSON.parse(input) as Partial<BackupPayload>
  if (!parsed || parsed.version !== 1 || !parsed.finance || !parsed.level2) {
    throw new Error("Backup invalido")
  }
  return parsed as BackupPayload
}
