import { describe, expect, it } from 'vitest'
import { newIdempotencyKey } from './idempotency'

describe('newIdempotencyKey', () => {
  it('matches the backend key format (letters, digits, _ . : -, max 100)', () => {
    const key = newIdempotencyKey()
    expect(key).toMatch(/^[A-Za-z0-9_.:-]+$/)
    expect(key.length).toBeLessThanOrEqual(100)
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('is unique per call', () => {
    const keys = new Set(Array.from({ length: 500 }, newIdempotencyKey))
    expect(keys.size).toBe(500)
  })
})
