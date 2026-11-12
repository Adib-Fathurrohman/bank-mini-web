import { createContext, useContext } from 'react'
import type { Staff } from '@/api/types'

export type AuthState =
  | { status: 'checking' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: Staff }
  | { status: 'unreachable'; error: string }

export interface AuthContextValue {
  state: AuthState
  /** Message shown on the login page, e.g. why the session ended. */
  notice: string | null
  login: (username: string, password: string) => Promise<Staff>
  /** Clears the session locally and revokes the token; `message` is shown on the login page. */
  logout: (message?: string | null) => Promise<void>
  retry: () => Promise<void>
  clearNotice: () => void
  /** The own account changed (email): keep the session and show the new data. */
  updateUser: (user: Staff) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

/** The logged-in staff member. Only call below <RequireRole>. */
export function useCurrentUser(): Staff {
  const { state } = useAuth()
  if (state.status !== 'authenticated') throw new Error('useCurrentUser called without a session')
  return state.user
}
