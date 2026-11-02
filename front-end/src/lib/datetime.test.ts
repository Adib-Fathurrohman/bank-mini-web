import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatTime, isInFuture, jakartaDate, jakartaToday, schoolYearStart } from './datetime'

describe('datetime', () => {
  it('shows UTC timestamps in WIB (UTC+7)', () => {
    // API.md: 2026-10-27T13:10:36Z = 20:10 WIB
    expect(formatTime('2026-10-27T13:10:36.000000Z')).toMatch(/^20[.:]10$/)
    expect(formatDateTime('2026-10-27T13:10:36.000000Z')).toMatch(/27 Okt 2026.*20[.:]10 WIB$/)
  })

  it('rolls over to the next day in Jakarta', () => {
    expect(formatDateTime('2026-10-27T18:30:00Z')).toMatch(/^28 Okt 2026/)
    expect(jakartaToday(new Date('2026-10-27T18:30:00Z'))).toBe('2026-10-28')
    expect(jakartaToday(new Date('2026-10-27T16:59:00Z'))).toBe('2026-10-27')
  })

  it('formats calendar dates without shifting them', () => {
    expect(formatDate('2026-10-27')).toBe('Selasa, 27 Oktober 2026')
  })

  it('detects future lock times', () => {
    const now = new Date('2026-10-27T13:00:00Z')
    expect(isInFuture('2026-10-27T13:25:37.830610Z', now)).toBe(true)
    expect(isInFuture('2026-10-27T12:59:00Z', now)).toBe(false)
    expect(isInFuture(null, now)).toBe(false)
  })
})

describe('jakartaDate', () => {
  it('uses the Jakarta calendar day, not UTC', () => {
    expect(jakartaDate('2026-10-27T18:30:00Z')).toBe('2026-10-28')
    expect(jakartaDate('2026-10-27T16:59:00Z')).toBe('2026-10-27')
  })
})

describe('schoolYearStart', () => {
  it('starts the school year in July', () => {
    expect(schoolYearStart('2026-07-01')).toBe(2026)
    expect(schoolYearStart('2026-11-02')).toBe(2026)
    expect(schoolYearStart('2027-06-30')).toBe(2026)
  })
})
