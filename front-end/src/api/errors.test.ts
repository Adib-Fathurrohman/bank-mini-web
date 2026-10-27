import { describe, expect, it } from 'vitest'
import { ADMIN_ACCOUNT_LOCKED_MESSAGE, errorFromResponse, translateFieldMessage } from './errors'

describe('errorFromResponse', () => {
  it('maps 401 and role 403 to session-ending auth errors', () => {
    const unauthenticated = errorFromResponse(401, { message: 'Unauthenticated.' })
    expect(unauthenticated.kind).toBe('auth')
    expect(unauthenticated.endsSession).toBe(true)

    const wrongRole = errorFromResponse(403, { message: 'Peran Anda tidak memiliki akses ke fitur ini.' })
    expect(wrongRole.kind).toBe('auth')
    expect(wrongRole.message).toBe('Peran Anda tidak memiliki akses ke fitur ini.')
    expect(wrongRole.endsSession).toBe(true)
  })

  it('does not end the session for the admin-account 403', () => {
    const error = errorFromResponse(403, { message: ADMIN_ACCOUNT_LOCKED_MESSAGE })
    expect(error.kind).toBe('auth')
    expect(error.endsSession).toBe(false)
  })

  it('separates field validation from business rules', () => {
    const validation = errorFromResponse(422, {
      message: 'The amount field must be at least 1.',
      errors: { amount: ['The amount field must be at least 1.'] },
    })
    expect(validation.kind).toBe('validation')
    expect(validation.field('amount')).toBe('Minimal 1.')
    expect(validation.field('pin')).toBeUndefined()

    const business = errorFromResponse(422, { message: 'Rekening berstatus ditangguhkan dan tidak dapat bertransaksi.' })
    expect(business.kind).toBe('business')
    expect(business.message).toBe('Rekening berstatus ditangguhkan dan tidak dapat bertransaksi.')
  })

  it('reads the cash mismatch extras on shift close', () => {
    const error = errorFromResponse(422, {
      message: 'Uang fisik kurang Rp2.000 dari saldo sistem.',
      system_balance: 252000,
      physical_balance: 250000,
      difference: -2000,
    })
    expect(error.kind).toBe('cashMismatch')
    expect(error.cashMismatch).toEqual({ system_balance: 252000, physical_balance: 250000, difference: -2000 })
  })

  it('reads the PIN failure extras', () => {
    const wrong = errorFromResponse(422, { message: 'PIN salah. Sisa percobaan: 2.', remaining_attempts: 2, pin_locked_until: null })
    expect(wrong.kind).toBe('pin')
    expect(wrong.pinFailure).toEqual({ remaining_attempts: 2, pin_locked_until: null })

    const locked = errorFromResponse(422, {
      message: 'PIN diblokir sementara karena terlalu banyak percobaan salah. Coba lagi pukul 20:25.',
      remaining_attempts: 0,
      pin_locked_until: '2026-10-27T13:25:37.830610Z',
    })
    expect(locked.pinFailure?.pin_locked_until).toBe('2026-10-27T13:25:37.830610Z')
  })

  it('never exposes a server error body', () => {
    const error = errorFromResponse(500, { message: 'SQLSTATE[HY000] ...', trace: [] })
    expect(error.kind).toBe('server')
    expect(error.message).not.toContain('SQLSTATE')
  })

  it('maps the remaining statuses', () => {
    expect(errorFromResponse(404, { message: 'Nasabah tidak ditemukan.' })).toMatchObject({ kind: 'notFound', message: 'Nasabah tidak ditemukan.' })
    expect(errorFromResponse(404, null).message).toBe('Data tidak ditemukan.')
    expect(errorFromResponse(409, { message: 'Blokir akunnya saja.' }).kind).toBe('conflict')
    expect(errorFromResponse(429, { message: 'Too Many Attempts.' }).kind).toBe('rateLimited')
    expect(errorFromResponse(405, { message: 'The DELETE method is not supported' }).kind).toBe('unexpected')
  })
})

describe('translateFieldMessage', () => {
  it('translates Laravel defaults and keeps backend Indonesian messages', () => {
    expect(translateFieldMessage('The username field is required.')).toBe('Wajib diisi.')
    expect(translateFieldMessage('The pin field must be 6 digits.')).toBe('Harus terdiri dari 6 digit angka.')
    expect(translateFieldMessage('The password field must be at least 8 characters.')).toBe('Minimal 8 karakter.')
    expect(translateFieldMessage('Username atau password salah.')).toBe('Username atau password salah.')
  })
})
