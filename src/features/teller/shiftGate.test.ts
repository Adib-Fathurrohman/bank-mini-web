import { describe, expect, it } from 'vitest'
import type { DailyReport } from '@/api/types'
import { activeShift, canTransact, shiftGate } from './shiftGate'

function report(overrides: Partial<DailyReport> = {}): DailyReport {
  return {
    id: 2,
    report_date: '2026-10-28',
    status: 'open',
    opening_balance: 150000,
    opened_at: '2026-10-27T23:36:00Z',
    transaction_count: 0,
    total_deposit: 0,
    total_withdrawal: 0,
    system_balance: 150000,
    physical_balance: null,
    difference: null,
    submitted_at: null,
    reviewed_at: null,
    supervisor_note: null,
    ...overrides,
  }
}

describe('shiftGate', () => {
  it('no shift yet today → open form', () => {
    const gate = shiftGate({ data: null, can_transact: false, closed_today: false })
    expect(gate.kind).toBe('none')
    expect(canTransact(gate)).toBe(false)
    expect(activeShift(gate)).toBeNull()
  })

  it('today closed → history only', () => {
    expect(shiftGate({ data: null, can_transact: false, closed_today: true }).kind).toBe('closedToday')
  })

  it('open shift of today → counter', () => {
    const gate = shiftGate({ data: report(), can_transact: true, transactions: [] })
    expect(gate.kind).toBe('running')
    expect(canTransact(gate)).toBe(true)
    expect(activeShift(gate)?.id).toBe(2)
  })

  it('rejected shift of today → can transact again', () => {
    const gate = shiftGate({ data: report({ status: 'rejected' }), can_transact: true, transactions: [] })
    expect(gate.kind).toBe('rejected')
    expect(canTransact(gate)).toBe(true)
  })

  it('active shift of an earlier day → only corrections and closing', () => {
    for (const status of ['open', 'rejected'] as const) {
      const gate = shiftGate({ data: report({ status, report_date: '2026-10-27' }), can_transact: false, transactions: [] })
      expect(gate.kind).toBe('stale')
      expect(canTransact(gate)).toBe(false)
      expect(activeShift(gate)?.report_date).toBe('2026-10-27')
    }
  })

  it('carries the drawer of a shift that tracks cash per denomination', () => {
    const drawer = [{ denomination: 50000, quantity: 3, subtotal: 150000 }]
    const tracked = shiftGate({ data: report({ cash_tracked: true }), can_transact: true, transactions: [], drawer })
    expect(tracked.kind === 'running' && tracked.drawer).toEqual(drawer)
  })

  it('has no drawer for a shift opened before per-denomination tracking', () => {
    const untracked = shiftGate({ data: report(), can_transact: true, transactions: [], drawer: null })
    expect(untracked.kind === 'running' && untracked.drawer).toBeNull()
    const missing = shiftGate({ data: report(), can_transact: true, transactions: [] })
    expect(missing.kind === 'running' && missing.drawer).toBeNull()
  })
})
