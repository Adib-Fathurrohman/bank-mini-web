import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import type { StaffRole } from '@/api/types'
import { FullPageStatus } from '@/components/FullPageStatus'
import { Button } from '@/components/Button'
import { useAuth } from './context'
import { ROLE_HOME } from './session'

const WRONG_ROLE_MESSAGE = 'Anda tidak memiliki akses ke halaman tersebut. Silakan masuk dengan akun yang sesuai.'

/**
 * Renders child routes only for a validated session with one of `roles`.
 * A logged-in user opening another role's URL is logged out and sent to the
 * login page, mirroring the backend's 403 behaviour (UKK rubric 3.2).
 * This is a convenience; the backend re-checks every request.
 */
export function RequireRole({ roles }: { roles: StaffRole[] }) {
  const { state, logout, retry } = useAuth()
  const location = useLocation()
  const wrongRole = state.status === 'authenticated' && !roles.includes(state.user.role)

  useEffect(() => {
    if (wrongRole) void logout(WRONG_ROLE_MESSAGE)
  }, [wrongRole, logout])

  if (state.status === 'checking') return <FullPageStatus title="Memeriksa sesi…" busy />
  if (state.status === 'unreachable') {
    return (
      <FullPageStatus title="Server tidak dapat dihubungi" description={state.error}>
        <Button onClick={() => void retry()}>Coba lagi</Button>
        <Button variant="secondary" onClick={() => void logout()}>
          Keluar
        </Button>
      </FullPageStatus>
    )
  }
  if (state.status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (wrongRole) return <FullPageStatus title="Mengalihkan…" busy />
  return <Outlet />
}

/** `/`: send a logged-in user to their role's home page. */
export function HomeRedirect() {
  const { state } = useAuth()
  if (state.status === 'authenticated') return <Navigate to={ROLE_HOME[state.user.role]} replace />
  if (state.status === 'anonymous') return <Navigate to="/login" replace />
  // checking / unreachable: let the guard UI handle it.
  return <RequireRole roles={['admin', 'supervisor', 'teller']} />
}
