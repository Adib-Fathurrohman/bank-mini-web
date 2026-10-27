import type { StaffRole } from '@/api/types'
import { ROLE_HOME } from '@/auth/session'

export interface NavItem {
  to: string
  label: string
}

// Menu per role, following the capability matrix in RBAC.md §5.
// Items are added here as each phase lands its pages.
export const NAVIGATION: Record<StaffRole, NavItem[]> = {
  admin: [{ to: ROLE_HOME.admin, label: 'Beranda' }],
  supervisor: [{ to: ROLE_HOME.supervisor, label: 'Beranda' }],
  teller: [{ to: ROLE_HOME.teller, label: 'Beranda' }],
}
