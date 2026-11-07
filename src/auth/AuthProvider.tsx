import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { configureClient } from '@/api/client'
import { ApiError, isApiError } from '@/api/errors'
import * as authApi from '@/api/endpoints/auth'
import type { Staff } from '@/api/types'
import { clearSession, readSession, writeSession } from './session'
import { AuthContext, type AuthState } from './context'

const CUSTOMER_REFUSED_MESSAGE =
  'Akun nasabah tidak dapat masuk di sini. Gunakan aplikasi mobile E-Teller Bank Mini.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>(() =>
    readSession() ? { status: 'checking' } : { status: 'anonymous' },
  )
  const [notice, setNotice] = useState<string | null>(null)

  /** Drops the session locally; the token is already invalid or is revoked separately. */
  const dropSession = useCallback(
    (message: string | null) => {
      clearSession()
      queryClient.clear()
      setNotice(message)
      setState({ status: 'anonymous' })
    },
    [queryClient],
  )

  // Any request that gets a session-ending 401/403 sends the user back to the login page (rubric 3.2).
  useEffect(() => {
    configureClient({
      getToken: () => readSession()?.token ?? null,
      // Idempotent, so several requests failing at once are harmless.
      onSessionEnded: (error: ApiError) => dropSession(error.message),
    })
  }, [dropSession])

  const validate = useCallback(async () => {
    const stored = readSession()
    if (!stored) {
      setState({ status: 'anonymous' })
      return
    }
    setState({ status: 'checking' })
    // A late answer must not revive a session that was dropped or replaced meanwhile
    // (e.g. a wrong-role logout while a second check was still in flight).
    const stillCurrent = () => readSession()?.token === stored.token
    try {
      const { data: user } = await authApi.fetchMe()
      if (!stillCurrent()) return
      writeSession({ ...stored, user })
      setState({ status: 'authenticated', user })
    } catch (error) {
      if (!stillCurrent()) return
      if (isApiError(error) && error.kind === 'auth') return // already handled globally
      // Backend down or erroring: keep the token and let the user retry.
      setState({ status: 'unreachable', error: isApiError(error) ? error.message : String(error) })
    }
  }, [])

  // Re-validate a stored token with GET /staff/me on load (AUTH.md §4).
  useEffect(() => {
    if (readSession()) void validate()
  }, [validate])

  const login = useCallback(async (username: string, password: string): Promise<Staff> => {
    const { data } = await authApi.login(username, password)
    if (data.actor !== 'staff') {
      // Do not leave a valid customer token behind.
      await authApi.revokeCustomerToken(data.token).catch(() => {})
      throw new ApiError({ kind: 'business', status: null, message: CUSTOMER_REFUSED_MESSAGE })
    }
    writeSession({ token: data.token, user: data.user, loggedInAt: Date.now() })
    setNotice(null)
    setState({ status: 'authenticated', user: data.user })
    return data.user
  }, [])

  const logout = useCallback(
    async (message: string | null = null) => {
      const token = readSession()?.token
      dropSession(message)
      // Always clear locally, even if revoking fails (AUTH.md §5).
      if (token) await authApi.logout(token).catch(() => {})
    },
    [dropSession],
  )

  const value = useMemo(
    () => ({ state, notice, login, logout, retry: validate, clearNotice: () => setNotice(null) }),
    [state, notice, login, logout, validate],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
