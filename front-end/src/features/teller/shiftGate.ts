import type { DailyReport, ShiftState, Transaction } from '@/api/types'

// Interprets GET /teller/shift (FRONTEND_AUDIT.md §6.2). Every teller page
// decides what to offer from this; the backend still re-checks each request.

export type ShiftGate =
  | { kind: 'none' } // no shift yet today: open-shift form
  | { kind: 'closedToday' } // today's shift was closed: history only
  | { kind: 'running'; shift: DailyReport; transactions: Transaction[] } // open, today
  | { kind: 'rejected'; shift: DailyReport; transactions: Transaction[] } // reopened by a supervisor, today
  | { kind: 'stale'; shift: DailyReport; transactions: Transaction[] } // active shift from an earlier day

export function shiftGate(state: ShiftState): ShiftGate {
  if (state.data === null) return state.closed_today ? { kind: 'closedToday' } : { kind: 'none' }
  const active = { shift: state.data, transactions: state.transactions }
  if (!state.can_transact) return { kind: 'stale', ...active }
  return state.data.status === 'rejected' ? { kind: 'rejected', ...active } : { kind: 'running', ...active }
}

/** Deposits and withdrawals need an active shift dated today. */
export function canTransact(gate: ShiftGate): boolean {
  return gate.kind === 'running' || gate.kind === 'rejected'
}

/** The active (open or rejected) shift, of any date: corrections and closing work on it. */
export function activeShift(gate: ShiftGate): DailyReport | null {
  return 'shift' in gate ? gate.shift : null
}
