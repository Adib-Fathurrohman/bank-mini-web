import { describe, expect, it } from 'vitest'
import {
  countsFromList,
  describeNotes,
  exceedsAvailable,
  fillFromDrawer,
  matchesAmount,
  pieceCount,
  remainderOf,
  toDenominationsPayload,
  toNotesPayload,
  totalOfCounts,
} from './denominations'

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

  it('reads API lists as counts and ignores unknown denominations', () => {
    expect(countsFromList([{ denomination: 50000, quantity: 2 }, { denomination: 7, quantity: 9 }, { denomination: 100, quantity: 0 }])).toEqual({
      50000: 2,
    })
    expect(countsFromList(null)).toEqual({})
  })

  it('counts pieces and the remainder against an amount', () => {
    expect(pieceCount({ 50000: 2, 1000: 3 })).toBe(5)
    expect(remainderOf(120_000, { 100000: 1 })).toBe(20_000)
    expect(remainderOf(10_000, { 20000: 1 })).toBe(-10_000)
  })

  it('finds rows that ask for more than the drawer holds', () => {
    expect(exceedsAvailable({ 10000: 3, 5000: 1 }, { 10000: 1, 5000: 4 })).toEqual({ 10000: { requested: 3, available: 1 } })
    expect(exceedsAvailable({}, { 10000: 1 })).toEqual({})
  })

  describe('fillFromDrawer', () => {
    it('uses the largest notes the drawer allows', () => {
      expect(fillFromDrawer(170_000, { 100000: 5, 50000: 5, 20000: 5 })).toEqual({ 100000: 1, 50000: 1, 20000: 1 })
    })

    it('falls back to smaller notes when the large ones run out', () => {
      expect(fillFromDrawer(150_000, { 100000: 0, 50000: 1, 20000: 5 })).toEqual({ 50000: 1, 20000: 5 })
    })

    it('backtracks when greedy would get stuck', () => {
      // Two 20000 notes overshoot 30000; the search gives one back and uses the 10000 instead.
      expect(fillFromDrawer(30_000, { 20000: 2, 10000: 1, 5000: 2 })).toEqual({ 20000: 1, 10000: 1 })
      expect(fillFromDrawer(25_000, { 20000: 1, 5000: 1 })).toEqual({ 20000: 1, 5000: 1 })
    })

    it('returns null when the drawer cannot pay the amount', () => {
      expect(fillFromDrawer(30_000, { 20000: 1 })).toBeNull()
      expect(fillFromDrawer(0, { 20000: 1 })).toBeNull()
      expect(fillFromDrawer(1_500, { 1000: 1 })).toBeNull()
    })

    it('always adds up exactly and stays within the drawer', () => {
      const drawer = { 100000: 2, 50000: 3, 20000: 4, 10000: 5, 5000: 6, 2000: 7, 1000: 8, 500: 9, 200: 10, 100: 11 }
      for (const amount of [100, 300, 4_700, 19_900, 87_600, 349_900]) {
        const filled = fillFromDrawer(amount, drawer)
        expect(filled).not.toBeNull()
        expect(totalOfCounts(filled!)).toBe(amount)
        expect(exceedsAvailable(filled!, drawer)).toEqual({})
      }
    })
  })

  it('describes notes largest first', () => {
    expect(describeNotes([{ denomination: 5000, quantity: 3 }, { denomination: 50000, quantity: 2 }])).toBe('2 × Rp50.000 · 3 × Rp5.000')
    expect(describeNotes([])).toBe('')
    expect(describeNotes(undefined)).toBe('')
  })

  it('matches only an exact total (no change is given for cash in)', () => {
    expect(matchesAmount(70_000, { 50000: 1, 20000: 1 })).toBe(true)
    expect(matchesAmount(70_000, { 50000: 1 })).toBe(false)
    expect(matchesAmount(70_000, { 100000: 1 })).toBe(false)
    expect(matchesAmount(70_000, {})).toBe(false)
  })

  it('builds the notes payload for one transaction', () => {
    expect(toNotesPayload({ 20000: 1, 5000: 3, 100: 0 })).toEqual({ '20000': 1, '5000': 3 })
  })
})
