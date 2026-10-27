import { ApiError, errorFromResponse, networkError } from './errors'

// The single HTTP client for the staff web app (AUTH.md §9). It adds the
// headers, attaches the bearer token, turns failures into ApiError and reports
// session-ending 401/403 responses to the auth layer.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
const DEFAULT_TIMEOUT_MS = 30_000

type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue>

export interface RequestOptions {
  query?: Query
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs?: number
  /**
   * `true` (default): send the stored token and report session-ending errors.
   * `false`: no token, no global handling (login).
   * A string: send this token instead and skip global handling.
   */
  auth?: boolean | string
}

interface ClientConfig {
  getToken: () => string | null
  onSessionEnded: (error: ApiError) => void
}

let config: ClientConfig = {
  getToken: () => null,
  onSessionEnded: () => {},
}

export function configureClient(next: ClientConfig): void {
  config = next
}

export function buildUrl(path: string, query?: Query): string {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function send(method: string, path: string, options: RequestOptions, accept: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: accept, ...options.headers }
  const auth = options.auth ?? true
  const token = typeof auth === 'string' ? auth : auth ? config.getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const timeout = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), { method, headers, body, signal })
  } catch (cause) {
    // A caller-initiated abort (e.g. a query being cancelled) is not a failure to report.
    if (options.signal?.aborted) throw cause
    throw networkError(cause)
  }

  if (!response.ok) {
    const error = errorFromResponse(response.status, await readJson(response))
    if (auth === true && error.endsSession) config.onSessionEnded(error)
    throw error
  }
  return response
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '')
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** JSON request. Resolves with the whole parsed body (some endpoints add top-level keys next to `data`). */
export async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(method, path, options, 'application/json')
  return (await readJson(response)) as T
}

/** JSON request that also reports the status, for money endpoints where 201 = recorded and 200 = replay. */
export async function requestWithStatus<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<{ status: number; body: T }> {
  const response = await send(method, path, options, 'application/json')
  return { status: response.status, body: (await readJson(response)) as T }
}

/** PDF download. Success is binary; errors are JSON and become ApiError like any other request. */
export async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const response = await send('GET', path, options, 'application/pdf, application/json')
  const type = response.headers.get('Content-Type') ?? ''
  if (type.includes('application/json')) {
    // Defensive: a JSON body on a 2xx is not a PDF.
    const body = await readJson(response)
    throw errorFromResponse(422, body)
  }
  return response.blob()
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}
