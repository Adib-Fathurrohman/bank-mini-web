import type { AccountStatus, ActivationStatus, DailyReportStatus, TransactionType } from '@/api/types'
import type { BadgeTone } from '@/components/Badge'
import type { ShiftGate } from './shiftGate'

// Indonesian labels; report statuses follow the backend's PDF labels (DATA_MODEL.md).

export const REPORT_STATUS_LABEL: Record<DailyReportStatus, string> = {
  open: 'Berjalan',
  submitted: 'Menunggu verifikasi',
  on_hold: 'Ditahan',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export const REPORT_STATUS_TONE: Record<DailyReportStatus, BadgeTone> = {
  open: 'info',
  submitted: 'neutral',
  on_hold: 'warning',
  approved: 'success',
  rejected: 'danger',
}

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  active: 'Aktif',
  suspended: 'Ditangguhkan',
  inactive: 'Ditutup',
}

/**
 * Where the student is with the Bank Mini app. Only `ready` can approve a
 * withdrawal: the PIN is created in the app after activation.
 */
export type AppState = 'pending' | 'noPin' | 'ready'

export function appState(customer: { activation_status: ActivationStatus; pin_set: boolean }): AppState {
  if (customer.activation_status === 'pending') return 'pending'
  return customer.pin_set ? 'ready' : 'noPin'
}

export const APP_STATE_LABEL: Record<AppState, string> = {
  pending: 'Belum aktivasi',
  noPin: 'Belum buat PIN',
  ready: 'Aplikasi aktif',
}

export const APP_STATE_TONE: Record<AppState, BadgeTone> = {
  pending: 'neutral',
  noPin: 'warning',
  ready: 'info',
}

/** Why a withdrawal cannot be requested yet, in the backend's own wording (FRONTEND_HANDOFF.md §15.5). */
export const APP_STATE_WITHDRAWAL_BLOCK: Record<Exclude<AppState, 'ready'>, string> = {
  pending: 'Nasabah belum mengaktifkan aplikasi Bank Mini, sehingga belum dapat melakukan penarikan.',
  noPin: 'Nasabah belum membuat PIN. PIN dibuat oleh nasabah di aplikasi Bank Mini setelah akun diaktifkan.',
}

/** The daily report PDF exists only after a matching close (API.md). */
export function reportPrintable(status: DailyReportStatus): boolean {
  return status === 'submitted' || status === 'on_hold' || status === 'approved'
}

/** Short shift state for the shell (sidebar block, top-bar pill). */
export const GATE_LABEL: Record<ShiftGate['kind'], string> = {
  none: 'Belum dibuka',
  closedToday: 'Ditutup hari ini',
  running: 'Berjalan',
  rejected: 'Ditolak supervisor',
  stale: 'Shift lama terbuka',
}

export const GATE_TONE: Record<ShiftGate['kind'], BadgeTone> = {
  none: 'warning',
  closedToday: 'neutral',
  running: 'success',
  rejected: 'danger',
  stale: 'warning',
}

/** Cash direction for the drawer and the account: deposits and reversed withdrawals bring money in. */
export function cashDirection(type: TransactionType): 'in' | 'out' {
  return type === 'deposit' || type === 'withdrawal_correction' ? 'in' : 'out'
}
