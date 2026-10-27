// Every non-2xx response (and every failed fetch) becomes one ApiError.
// See docs/FRONTEND_AUDIT.md §5.4 for how each kind is shown.

export type ApiErrorKind =
  | 'auth' // 401, 403: session is no longer valid for this request
  | 'validation' // 422 with `errors`
  | 'business' // 422 without `errors`: a business rule refused; nothing was saved
  | 'cashMismatch' // 422 on shift close with system/physical balance and difference
  | 'pin' // 422 on withdrawal / PIN change with remaining_attempts
  | 'notFound' // 404
  | 'conflict' // 409
  | 'rateLimited' // 429
  | 'server' // 5xx
  | 'network' // no response (offline, timeout): outcome unknown
  | 'unexpected' // anything else (405, malformed body, ...)

export type FieldErrors = Record<string, string[]>

export interface CashMismatch {
  system_balance: number
  physical_balance: number
  difference: number
}

export interface PinFailure {
  remaining_attempts: number
  pin_locked_until: string | null
}

const GENERIC_MESSAGES: Partial<Record<ApiErrorKind, string>> = {
  server: 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi.',
  network: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.',
  rateLimited: 'Terlalu banyak percobaan. Tunggu sekitar satu menit lalu coba lagi.',
  unexpected: 'Permintaan tidak dapat diproses.',
}

/**
 * The one 403 that is a normal business error rather than a lost session
 * (RBAC.md §8): editing an administrator account.
 */
export const ADMIN_ACCOUNT_LOCKED_MESSAGE = 'Akun administrator tidak dapat diubah melalui API.'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly fieldErrors: FieldErrors
  readonly cashMismatch: CashMismatch | null
  readonly pinFailure: PinFailure | null

  constructor(init: {
    kind: ApiErrorKind
    status: number | null
    message: string
    fieldErrors?: FieldErrors
    cashMismatch?: CashMismatch | null
    pinFailure?: PinFailure | null
    cause?: unknown
  }) {
    super(init.message, { cause: init.cause })
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.fieldErrors = init.fieldErrors ?? {}
    this.cashMismatch = init.cashMismatch ?? null
    this.pinFailure = init.pinFailure ?? null
  }

  /** First message for a field, translated to Indonesian where it is a Laravel default. */
  field(name: string): string | undefined {
    const first = this.fieldErrors[name]?.[0]
    return first === undefined ? undefined : translateFieldMessage(first)
  }

  /** True for the 403/401 responses that must end the session (rubric 3.2). */
  get endsSession(): boolean {
    return this.kind === 'auth' && this.message !== ADMIN_ACCOUNT_LOCKED_MESSAGE
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFieldErrors(value: unknown): value is FieldErrors {
  return isRecord(value) && Object.values(value).every((v) => Array.isArray(v) && v.every((m) => typeof m === 'string'))
}

/** Builds an ApiError from an HTTP status and the parsed JSON body (or null). */
export function errorFromResponse(status: number, body: unknown): ApiError {
  const record = isRecord(body) ? body : {}
  const serverMessage = typeof record.message === 'string' ? record.message : ''

  if (status >= 500) {
    // Never surface the body: with APP_DEBUG=true it contains a stack trace.
    return new ApiError({ kind: 'server', status, message: GENERIC_MESSAGES.server! })
  }
  if (status === 429) {
    return new ApiError({ kind: 'rateLimited', status, message: GENERIC_MESSAGES.rateLimited! })
  }

  const message = serverMessage || GENERIC_MESSAGES.unexpected!

  if (status === 401) {
    return new ApiError({ kind: 'auth', status, message: 'Sesi Anda telah berakhir. Silakan masuk kembali.' })
  }
  if (status === 403) return new ApiError({ kind: 'auth', status, message })
  if (status === 404) return new ApiError({ kind: 'notFound', status, message: serverMessage || 'Data tidak ditemukan.' })
  if (status === 409) return new ApiError({ kind: 'conflict', status, message })

  if (status === 422) {
    if (isFieldErrors(record.errors)) {
      return new ApiError({ kind: 'validation', status, message, fieldErrors: record.errors })
    }
    if (
      typeof record.difference === 'number' &&
      typeof record.system_balance === 'number' &&
      typeof record.physical_balance === 'number'
    ) {
      return new ApiError({
        kind: 'cashMismatch',
        status,
        message,
        cashMismatch: {
          system_balance: record.system_balance,
          physical_balance: record.physical_balance,
          difference: record.difference,
        },
      })
    }
    if (typeof record.remaining_attempts === 'number') {
      return new ApiError({
        kind: 'pin',
        status,
        message,
        pinFailure: {
          remaining_attempts: record.remaining_attempts,
          pin_locked_until: typeof record.pin_locked_until === 'string' ? record.pin_locked_until : null,
        },
      })
    }
    return new ApiError({ kind: 'business', status, message })
  }

  return new ApiError({ kind: 'unexpected', status, message })
}

export function networkError(cause: unknown): ApiError {
  return new ApiError({ kind: 'network', status: null, message: GENERIC_MESSAGES.network!, cause })
}

// Laravel's default field messages are English (backend limitation L9).
// Translate the common ones; anything else (incl. the backend's own
// Indonesian messages) passes through unchanged.
const FIELD_MESSAGE_RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^The .+ field is required\.$/, () => 'Wajib diisi.'],
  [/^The .+ field must be an integer\.$/, () => 'Harus berupa bilangan bulat.'],
  [/^The .+ field must be a number\.$/, () => 'Harus berupa angka.'],
  [/^The .+ field must be (\d+) digits\.$/, (m) => `Harus terdiri dari ${m[1]} digit angka.`],
  [/^The .+ field must be at least (\d+) characters\.$/, (m) => `Minimal ${m[1]} karakter.`],
  [/^The .+ field must be at least (\d+)\.$/, (m) => `Minimal ${m[1]}.`],
  [/^The .+ field must not be greater than (\d+) characters\.$/, (m) => `Maksimal ${m[1]} karakter.`],
  [/^The .+ field must not be greater than (\d+)\.$/, (m) => `Maksimal ${m[1]}.`],
  [/^The .+ has already been taken\.$/, () => 'Sudah digunakan.'],
  [/^The selected .+ is invalid\.$/, () => 'Pilihan tidak valid.'],
  [/^The .+ field format is invalid\.$/, () => 'Format tidak valid.'],
  [/^The .+ field confirmation does not match\.$/, () => 'Konfirmasi tidak cocok.'],
]

export function translateFieldMessage(message: string): string {
  for (const [pattern, render] of FIELD_MESSAGE_RULES) {
    const match = message.match(pattern)
    if (match) return render(match)
  }
  return message
}
