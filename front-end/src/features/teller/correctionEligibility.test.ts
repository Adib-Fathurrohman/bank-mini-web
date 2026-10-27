import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/api/types'
import { canCorrect, correctedIds } from './correctionEligibility'

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 1,
    type: 'deposit',
    type_label: 'Setor tunai',
    amount: 1000,
    amount_in_words: 'seribu rupiah',
    balance_before: 0,
    balance_after: 1000,
    created_at: '2026-10-27T13:10:36.000000Z',
    daily_report_id: 2,
    corrects_transaction_id: null,
    note: null,
    customer: { id: 1, account_number: 'RPL-2026-001', full_name: 'Budi Santoso' },
    ...overrides,
  }
}

describe('correction eligibility', () => {
  const shiftTransactions = [
    tx({ id: 4, type: 'deposit' }),
    tx({ id: 5, type: 'withdrawal' }),
    tx({ id: 6, type: 'deposit' }),
    tx({ id: 7, type: 'deposit_correction', corrects_transaction_id: 6 }),
  ]
  const corrected = correctedIds(shiftTransactions)

  it('derives corrected rows from the shift list (which lacks corrected_by)', () => {
    expect([...corrected]).toEqual([6])
  })

  it('offers correction for uncorrected deposits/withdrawals of the active shift', () => {
    expect(canCorrect(shiftTransactions[0]!, 2, corrected)).toBe(true)
    expect(canCorrect(shiftTransactions[1]!, 2, corrected)).toBe(true)
  })

  it('refuses already corrected rows, corrections, other shifts and no shift', () => {
    expect(canCorrect(shiftTransactions[2]!, 2, corrected)).toBe(false)
    expect(canCorrect(shiftTransactions[3]!, 2, corrected)).toBe(false)
    expect(canCorrect(shiftTransactions[0]!, 3, corrected)).toBe(false)
    expect(canCorrect(shiftTransactions[0]!, null, corrected)).toBe(false)
  })

  it('uses corrected_by when the endpoint provides it', () => {
    const row = tx({ id: 9, corrected_by: { id: 10, type: 'deposit_correction', created_at: '2026-10-27T13:20:00Z' } })
    expect(canCorrect(row, 2)).toBe(false)
    expect(canCorrect(tx({ id: 9, corrected_by: null }), 2)).toBe(true)
  })
})
