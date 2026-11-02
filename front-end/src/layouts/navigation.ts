import type { StaffRole } from '@/api/types'
import { ROLE_HOME } from '@/auth/session'
import type { IconName } from '@/components/Icon'

export interface NavItem {
  to: string
  label: string
  icon: IconName
}

// Pages admin and supervisor share; on customers and staff the admin also gets the write actions.
const SHARED_READ: NavItem[] = [
  { to: '/customers', label: 'Nasabah', icon: 'idCard' },
  { to: '/staff', label: 'Staf', icon: 'users' },
  { to: '/audit/transactions', label: 'Log audit', icon: 'history' },
  { to: '/audit/journals', label: 'Jurnal', icon: 'book' },
  { to: '/reports', label: 'Laporan', icon: 'printer' },
]

// Menu per role, following the capability matrix in RBAC.md §5.
// Items are added here as each phase lands its pages.
export const NAVIGATION: Record<StaffRole, NavItem[]> = {
  admin: [
    { to: ROLE_HOME.admin, label: 'Beranda', icon: 'dashboard' },
    SHARED_READ[0]!,
    { to: '/admin/graduation', label: 'Kelulusan', icon: 'graduation' },
    ...SHARED_READ.slice(1),
    { to: '/admin/settings', label: 'Pengaturan', icon: 'settings' },
  ],
  supervisor: [
    { to: ROLE_HOME.supervisor, label: 'Dasbor', icon: 'dashboard' },
    { to: '/supervisor/reports', label: 'Laporan harian', icon: 'file' },
    { to: '/supervisor/vault', label: 'Brankas', icon: 'vault' },
    ...SHARED_READ,
  ],
  teller: [
    { to: ROLE_HOME.teller, label: 'Shift', icon: 'banknote' },
    { to: '/teller/counter', label: 'Layanan nasabah', icon: 'userSearch' },
    { to: '/teller/transactions', label: 'Transaksi & koreksi', icon: 'list' },
    { to: '/teller/close', label: 'Tutup shift', icon: 'lock' },
    { to: '/teller/history', label: 'Riwayat shift', icon: 'history' },
  ],
}
