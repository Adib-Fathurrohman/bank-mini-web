import { describe, expect, it } from 'vitest'
import { allowedDecisions, awaitingReview, NOTE_MAX, validateNote } from './review'

describe('allowedDecisions', () => {
  it('offers all three decisions for a submitted report', () => {
    expect(allowedDecisions('submitted')).toEqual(['approve', 'hold', 'reject'])
  })

  it('cannot hold a report that is already on hold', () => {
    expect(allowedDecisions('on_hold')).toEqual(['approve', 'reject'])
  })

  it('offers nothing for open, approved or rejected reports', () => {
    for (const status of ['open', 'approved', 'rejected'] as const) {
      expect(allowedDecisions(status)).toEqual([])
      expect(awaitingReview(status)).toBe(false)
    }
  })
})

describe('validateNote', () => {
  it('lets approval go without a note', () => {
    expect(validateNote('approve', '')).toBeNull()
  })

  it('requires a note to hold or reject, ignoring whitespace', () => {
    expect(validateNote('hold', '   ')).not.toBeNull()
    expect(validateNote('reject', '')).not.toBeNull()
    expect(validateNote('reject', 'Slip #12 hilang')).toBeNull()
  })

  it('limits the note to the backend maximum', () => {
    expect(validateNote('approve', 'a'.repeat(NOTE_MAX))).toBeNull()
    expect(validateNote('approve', 'a'.repeat(NOTE_MAX + 1))).not.toBeNull()
  })
})
