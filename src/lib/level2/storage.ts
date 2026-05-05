import { Level2State } from "@/lib/level2/types"

const STORAGE_PREFIX = "organiza-mei:level2"

function canUseStorage() {
  return typeof window !== "undefined"
}

function key(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

export function createEmptyLevel2State(): Level2State {
  return {
    importBatches: [],
    importedTransactions: [],
    categoryRules: [],
    attachments: [],
    dasRecords: [],
    goals: [],
    userSettings: {
      mei_annual_limit: 81260,
    },
  }
}

export function loadLevel2State(userId: string | null): Level2State | null {
  if (!canUseStorage() || !userId) return null
  try {
    const raw = window.localStorage.getItem(key(userId))
    if (!raw) return null
    return JSON.parse(raw) as Level2State
  } catch {
    return null
  }
}

export function saveLevel2State(userId: string | null, state: Level2State) {
  if (!canUseStorage() || !userId) return
  window.localStorage.setItem(key(userId), JSON.stringify(state))
}

export function clearLevel2State(userId: string | null) {
  if (!canUseStorage() || !userId) return
  window.localStorage.removeItem(key(userId))
}
