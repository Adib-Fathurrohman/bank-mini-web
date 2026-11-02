import { describe, expect, it } from 'vitest'
import type { CustomerSummary } from '@/api/types'
import { withdrawalBlocker } from './withdrawalPrecheck'

const now = new Date('2026-10-28T00:00:00Z')

function customer(overrides: Partial<CustomerSummary> = {}): CustomerSummary {
  return {
    id: 1,
    account_number: 'RPL-2026-001',
    nis: '20260001',
    full_name: 'Budi Santoso',
    class: 'X',
    group: '1',
    major_name: 'Rekayasa Perangkat Lunak',
    account_status: 'active',
    balance: 625000,
    pin_locked_until: null,
    activation_status: 'activated',
    pin_set: true,
    ...overrides,
  }
}

describe('withdrawalBlocker (checks before the PIN, limitation L2)', () => {
  it('allows up to balance minus the minimum balance', () => {
    expect(withdrawalBlocker(customer(), 615000, 10000, now)).toBeNull()
  })

  it('refuses amounts that would go below the minimum balance, naming the maximum', () => {
    expect(withdrawalBlocker(customer(), 615100, 10000, now)).toBe(
      'Saldo tidak mencukupi. Saldo minimum Rp10.000 harus tetap tersisa; penarikan maksimal Rp615.000.',
    )
    expect(withdrawalBlocker(customer({ balance: 5000 }), 100, 10000, now)).toMatch(/maksimal Rp0\./)
  })

  it('refuses suspended accounts and active PIN locks', () => {
    expect(withdrawalBlocker(customer({ account_status: 'suspended' }), 1000, 10000, now)).toMatch(/tidak aktif/)
    expect(withdrawalBlocker(customer({ pin_locked_until: '2026-10-28T00:10:00Z' }), 1000, 10000, now)).toMatch(/diblokir/)
  })

  it('ignores an expired PIN lock', () => {
    expect(withdrawalBlocker(customer({ pin_locked_until: '2026-10-27T23:50:00Z' }), 1000, 10000, now)).toBeNull()
  })
})
