import type { Transaction } from '@/api/types'

// Which transactions may get a "Koreksi" button (FRONTEND_AUDIT.md §6.4):
// an own deposit/withdrawal, not yet corrected, in the active shift.
//
// `GET /teller/shift` returns its transactions WITHOUT `corrected_by`, so a
// row's corrected state is derived from the corrections in the same list
// (a correction always lives in the original's shift). Rows from
// `GET /teller/transactions` carry `corrected_by`, which is used when present.
// The backend re-checks every rule; this only decides what to offer.

export function correctedIds(transactions: Transaction[]): Set<number> {
  const ids = new Set<number>()
  for (const t of transactions) {
    if (t.corrects_transaction_id !== null) ids.add(t.corrects_transaction_id)
  }
  return ids
}

export function canCorrect(
  transaction: Transaction,
  activeShiftId: number | null,
  corrected: Set<number> = new Set(),
): boolean {
  if (activeShiftId === null || transaction.daily_report_id !== activeShiftId) return false
  if (transaction.type !== 'deposit' && transaction.type !== 'withdrawal') return false
  if (transaction.corrected_by) return false
  return !corrected.has(transaction.id)
}
