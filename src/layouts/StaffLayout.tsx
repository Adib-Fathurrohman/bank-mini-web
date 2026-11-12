import { useCurrentUser } from '@/auth/context'
import { TellerLayout } from '@/features/teller/TellerLayout'
import { AppShell } from './AppShell'

/** Shell for roles without a status block (supervisor, admin). */
export function StaffLayout() {
  return <AppShell />
}

/** The shell of the logged-in role, for pages every role has (the profile). */
export function RoleLayout() {
  const user = useCurrentUser()
  return user.role === 'teller' ? <TellerLayout /> : <StaffLayout />
}
