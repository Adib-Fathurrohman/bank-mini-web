import type { Staff, StaffRole } from '@/api/types'

// The session lives in sessionStorage: counter PCs are shared, and closing the
// browser should end the session. Only the token
// and the profile are stored, never passwords or PINs.

export interface StoredSession {
  token: string
  user: Staff
  /** Epoch ms. The API does not return the token expiry (8 h after login). */
  loggedInAt: number
}

const KEY = 'bankmini.session'

let memory: StoredSession | null = null

export function readSession(): StoredSession | null {
  if (memory) return memory
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (typeof parsed?.token !== 'string' || typeof parsed?.user?.role !== 'string') return null
    memory = parsed
    return parsed
  } catch {
    return null
  }
}

export function writeSession(session: StoredSession): void {
  memory = session
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // Storage unavailable (private mode, blocked): the in-memory copy still works for this tab.
  }
}

export function clearSession(): void {
  memory = null
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  teller: 'Teller',
}

export const ROLE_HOME: Record<StaffRole, string> = {
  admin: '/admin',
  supervisor: '/supervisor',
  teller: '/teller',
}
