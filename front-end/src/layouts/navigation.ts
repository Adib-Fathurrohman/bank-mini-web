import type { StaffRole } from '@/api/types'
import { ROLE_HOME } from '@/auth/session'
import type { IconName } from '@/components/Icon'

export interface NavItem {
  to: string
  label: string
  icon: IconName
}

// Menu per role, following the capability matrix in RBAC.md §5.
// Items are added here as each phase lands its pages.
export const NAVIGATION: Record<StaffRole, NavItem[]> = {
  admin: [{ to: ROLE_HOME.admin, label: 'Beranda', icon: 'list' }],
  supervisor: [
    { to: ROLE_HOME.supervisor, label: 'Dasbor', icon: 'dashboard' },
    { to: '/supervisor/reports', label: 'Laporan harian', icon: 'file' },
    { to: '/supervisor/vault', label: 'Brankas', icon: 'vault' },
  ],
  teller: [
    { to: ROLE_HOME.teller, label: 'Shift', icon: 'banknote' },
    { to: '/teller/counter', label: 'Layanan nasabah', icon: 'userSearch' },
    { to: '/teller/transactions', label: 'Transaksi & koreksi', icon: 'list' },
    { to: '/teller/close', label: 'Tutup shift', icon: 'lock' },
    { to: '/teller/history', label: 'Riwayat shift', icon: 'history' },
  ],
}
