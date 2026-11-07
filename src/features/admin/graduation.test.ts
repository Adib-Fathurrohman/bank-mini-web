import { describe, expect, it } from 'vitest'
import type { Customer } from '@/api/types'
import { closeOneByOne, summarizeSelection, type GraduationOutcome } from './graduation'

const customer = (id: number, balance: number) => ({ id, balance }) as Customer

describe('summarizeSelection', () => {
  it('counts only selected accounts and the money left in them', () => {
    const rows = [customer(1, 0), customer(2, 10_000), customer(3, 25_000)]
    expect(summarizeSelection(rows, new Set([1, 2]))).toEqual({ count: 2, withBalance: 1, remaining: 10_000 })
    expect(summarizeSelection(rows, new Set())).toEqual({ count: 0, withBalance: 0, remaining: 0 })
  })
})

describe('closeOneByOne', () => {
  it('keeps going after a failure and reports each account in order', async () => {
    const results: [number, GraduationOutcome][] = []
    await closeOneByOne(
      [1, 2, 3],
      async (id) => {
        if (id === 2) throw new Error('Data tidak ditemukan.')
      },
      (id, outcome) => results.push([id, outcome]),
    )
    expect(results).toEqual([
      [1, { status: 'closed' }],
      [2, { status: 'failed', message: 'Data tidak ditemukan.' }],
      [3, { status: 'closed' }],
    ])
  })
})
