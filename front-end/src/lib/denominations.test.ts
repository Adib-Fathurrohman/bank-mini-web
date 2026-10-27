import { describe, expect, it } from 'vitest'
import { toDenominationsPayload, totalOfCounts } from './denominations'

describe('denominations', () => {
  it('totals a cash count', () => {
    expect(totalOfCounts({ 50000: 2, 10000: 5 })).toBe(150_000)
    expect(totalOfCounts({ 100000: 2, 50000: 1, 2000: 1 })).toBe(252_000)
    expect(totalOfCounts({})).toBe(0)
  })

  it('builds the request body with string keys and without zero rows', () => {
    expect(toDenominationsPayload({ 50000: 2, 10000: 0, 100: 3 })).toEqual({
      denominations: { '50000': 2, '100': 3 },
    })
  })
})
