import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/errors'
import { formError, looksLikeEmail, passwordProblem, RATE_LIMITED_MESSAGE } from './authForms'

describe('formError', () => {
  it('words a 429 the same everywhere', () => {
    expect(formError(new ApiError({ kind: 'rateLimited', status: 429, message: 'lain' }))).toBe(RATE_LIMITED_MESSAGE)
  })

  it('passes other messages through', () => {
    expect(formError(new ApiError({ kind: 'business', status: 422, message: 'Password saat ini salah.' }))).toBe('Password saat ini salah.')
  })
})

describe('passwordProblem', () => {
  it('needs 8 characters and a matching confirmation', () => {
    expect(passwordProblem('short', 'short')).toMatch(/minimal 8/)
    expect(passwordProblem('longenough', 'different1')).toMatch(/tidak sama/)
    expect(passwordProblem('longenough', 'longenough')).toBeNull()
  })
})

describe('looksLikeEmail', () => {
  it('accepts address-shaped text only', () => {
    expect(looksLikeEmail(' guru@sekolah.sch.id ')).toBe(true)
    expect(looksLikeEmail('guru@sekolah')).toBe(false)
    expect(looksLikeEmail('guru sekolah.id')).toBe(false)
  })
})
