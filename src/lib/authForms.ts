import type { ApiError } from '@/api/errors'

export const RATE_LIMITED_MESSAGE = 'Terlalu banyak percobaan, tunggu sebentar.'
export const MIN_PASSWORD_LENGTH = 8

/** The text under a form for a refused request: 429 gets the fixed wording, anything else the server's message. */
export function formError(error: ApiError): string {
  return error.kind === 'rateLimited' ? RATE_LIMITED_MESSAGE : error.message
}

/** Client-side checks that mirror the backend (min 8, confirmation); null when fine. */
export function passwordProblem(password: string, confirmation: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`
  if (password !== confirmation) return 'Konfirmasi password tidak sama.'
  return null
}

/** `a@b.c`-shaped; the server validates it properly. */
export function looksLikeEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value.trim())
}
