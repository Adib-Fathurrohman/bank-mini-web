import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, buildUrl, configureClient, requestBlob, requestWithStatus } from './client'
import type { ApiError } from './errors'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('api client', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const onSessionEnded = vi.fn<(error: ApiError) => void>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    configureClient({ getToken: () => 'stored-token', onSessionEnded })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    onSessionEnded.mockReset()
  })

  it('builds URLs under /api, encodes values and skips empty ones', () => {
    expect(buildUrl('/teller/customers/lookup', { identifier: 'BANKMINI:RPL-2026-001', page: undefined, q: '' })).toBe(
      '/api/teller/customers/lookup?identifier=BANKMINI%3ARPL-2026-001',
    )
  })

  it('sends JSON headers and the stored bearer token', async () => {
    fetchMock.mockResolvedValue(json(200, { data: { ok: true } }))
    await api.post('/teller/deposits', { amount: 1000 })
    const [, init] = fetchMock.mock.calls[0]!
    const headers = init!.headers as Record<string, string>
    expect(headers.Accept).toBe('application/json')
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers.Authorization).toBe('Bearer stored-token')
    expect(init!.body).toBe('{"amount":1000}')
  })

  it('sends no token when auth is false and an explicit one when given', async () => {
    fetchMock.mockResolvedValue(json(200, {}))
    await api.post('/login', {}, { auth: false })
    expect((fetchMock.mock.calls[0]![1]!.headers as Record<string, string>).Authorization).toBeUndefined()
    await api.post('/customer/logout', undefined, { auth: 'other' })
    expect((fetchMock.mock.calls[1]![1]!.headers as Record<string, string>).Authorization).toBe('Bearer other')
  })

  it('reports session-ending errors once and rethrows them', async () => {
    fetchMock.mockResolvedValue(json(401, { message: 'Unauthenticated.' }))
    await expect(api.get('/staff/me')).rejects.toMatchObject({ kind: 'auth' })
    expect(onSessionEnded).toHaveBeenCalledTimes(1)
  })

  it('does not report session errors for requests with their own token', async () => {
    fetchMock.mockResolvedValue(json(401, { message: 'Unauthenticated.' }))
    await expect(api.post('/staff/logout', undefined, { auth: 'old' })).rejects.toMatchObject({ kind: 'auth' })
    expect(onSessionEnded).not.toHaveBeenCalled()
  })

  it('does not end the session on business errors', async () => {
    fetchMock.mockResolvedValue(json(422, { message: 'Belum ada shift yang dibuka.' }))
    await expect(api.post('/teller/deposits', {})).rejects.toMatchObject({ kind: 'business' })
    expect(onSessionEnded).not.toHaveBeenCalled()
  })

  it('turns a failed fetch into a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(api.get('/settings')).rejects.toMatchObject({ kind: 'network' })
  })

  it('reports 201 vs 200 for idempotent replays', async () => {
    fetchMock.mockResolvedValueOnce(json(201, { data: { id: 4 } })).mockResolvedValueOnce(json(200, { data: { id: 4 } }))
    expect((await requestWithStatus('POST', '/teller/deposits')).status).toBe(201)
    expect((await requestWithStatus('POST', '/teller/deposits')).status).toBe(200)
  })

  it('returns PDFs as blobs and JSON errors as ApiError', async () => {
    fetchMock.mockResolvedValueOnce(new Response(new Blob(['%PDF']), { status: 200, headers: { 'Content-Type': 'application/pdf' } }))
    const blob = await requestBlob('/teller/transactions/4/receipt')
    expect(await blob.text()).toBe('%PDF')

    fetchMock.mockResolvedValueOnce(json(422, { message: 'Laporan harian baru dapat dicetak setelah shift ditutup.' }))
    await expect(requestBlob('/teller/daily-reports/2/export')).rejects.toMatchObject({
      kind: 'business',
      message: 'Laporan harian baru dapat dicetak setelah shift ditutup.',
    })
  })
})
