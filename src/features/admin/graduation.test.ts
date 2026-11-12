import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/errors'
import { promotionBlockedReason, runErrorMessage, scopeLabel } from './graduation'

const conflict = (code: string, message = 'x') => new ApiError({ kind: 'conflict', status: 409, message, code })

describe('scopeLabel', () => {
  it('writes the picked class, major and group', () => {
    expect(scopeLabel('XII', null, null)).toBe('kelas XII')
    expect(scopeLabel('XII', 'RPL', '2')).toBe('kelas XII RPL 2')
    expect(scopeLabel('X', null, '1')).toBe('kelas X 1')
  })
})

describe('runErrorMessage', () => {
  it('asks to reload the preview when the data changed', () => {
    expect(runErrorMessage(conflict('graduation_selection_changed'))).toMatchObject({ reload: true })
    expect(runErrorMessage(conflict('promotion_selection_changed')).message).toMatch(/Muat ulang pratinjau/)
  })

  it('explains the class promotion refusals', () => {
    expect(runErrorMessage(conflict('promotion_xii_not_empty')).message).toMatch(/kelulusan kelas XII/)
    expect(runErrorMessage(conflict('promotion_already_done', 'Sudah dijalankan.')).message).toBe('Sudah dijalankan.')
  })

  it("passes any other message through and does not reload", () => {
    const other = new ApiError({ kind: 'business', status: 422, message: 'Server bilang tidak.', code: 'other' })
    expect(runErrorMessage(other)).toEqual({ message: 'Server bilang tidak.', reload: false })
  })
})

describe('promotionBlockedReason', () => {
  const base = { open_xii_count: 0, already_done: false, school_year: '2027/2028', x_count: 10, xi_count: 8 }

  it('allows the run when XII is empty and it has not run this year', () => {
    expect(promotionBlockedReason(base)).toBeNull()
  })

  it('blocks while class XII still has open accounts', () => {
    expect(promotionBlockedReason({ ...base, open_xii_count: 3 })).toMatchObject({ kind: 'xii' })
  })

  it('blocks a second run in the same school year', () => {
    expect(promotionBlockedReason({ ...base, already_done: true })?.message).toMatch(/2027\/2028 sudah dijalankan/)
  })

  it('blocks when there is nobody to promote', () => {
    expect(promotionBlockedReason({ ...base, x_count: 0, xi_count: 0 })).toMatchObject({ kind: 'empty' })
  })
})
