import { describe, expect, it } from 'vitest'
import { formatRupiah, parseRupiahInput, validateTransactionAmount } from './money'

describe('formatRupiah', () => {
  it('uses dot thousands separators without a space', () => {
    expect(formatRupiah(1_500_000)).toBe('Rp1.500.000')
    expect(formatRupiah(10_000)).toBe('Rp10.000')
    expect(formatRupiah(0)).toBe('Rp0')
  })
  it('puts the sign before Rp', () => {
    expect(formatRupiah(-2_000)).toBe('-Rp2.000')
  })
})

describe('parseRupiahInput', () => {
  it('keeps digits only', () => {
    expect(parseRupiahInput('125.000')).toBe(125_000)
    expect(parseRupiahInput('Rp 50.000')).toBe(50_000)
    expect(parseRupiahInput('')).toBeNull()
    expect(parseRupiahInput('abc')).toBeNull()
  })
})

describe('validateTransactionAmount', () => {
  it('accepts multiples of 100 within range', () => {
    expect(validateTransactionAmount(100)).toBeNull()
    expect(validateTransactionAmount(125_000)).toBeNull()
    expect(validateTransactionAmount(100_000_000)).toBeNull()
  })
  it('rejects empty, zero and out-of-range amounts', () => {
    expect(validateTransactionAmount(null)).toMatch(/Masukkan/)
    expect(validateTransactionAmount(0)).toMatch(/Masukkan/)
    expect(validateTransactionAmount(100_000_100)).toMatch(/maksimal/)
  })
  it('rejects amounts that cannot be counted in cash (L1)', () => {
    expect(validateTransactionAmount(150)).toMatch(/kelipatan Rp100/)
    expect(validateTransactionAmount(10_050)).toMatch(/kelipatan Rp100/)
  })
})
