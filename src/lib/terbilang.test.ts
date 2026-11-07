import { describe, expect, it } from 'vitest'
import { terbilang, terbilangRupiah } from './terbilang'

describe('terbilang', () => {
  it.each([
    [0, 'nol'],
    [1, 'satu'],
    [10, 'sepuluh'],
    [11, 'sebelas'],
    [15, 'lima belas'],
    [20, 'dua puluh'],
    [99, 'sembilan puluh sembilan'],
    [100, 'seratus'],
    [110, 'seratus sepuluh'],
    [250, 'dua ratus lima puluh'],
    [1_000, 'seribu'],
    [1_100, 'seribu seratus'],
    [2_000, 'dua ribu'],
    [11_000, 'sebelas ribu'],
    [100_000, 'seratus ribu'],
    [101_000, 'seratus satu ribu'],
    [1_000_000, 'satu juta'],
    [1_250_500, 'satu juta dua ratus lima puluh ribu lima ratus'],
    [100_000_000, 'seratus juta'],
    [2_147_483_647, 'dua miliar seratus empat puluh tujuh juta empat ratus delapan puluh tiga ribu enam ratus empat puluh tujuh'],
  ])('%i → %s', (value, words) => {
    expect(terbilang(value)).toBe(words)
  })

  it('matches the backend amount_in_words examples (API.md)', () => {
    expect(terbilangRupiah(125_000)).toBe('seratus dua puluh lima ribu rupiah')
    expect(terbilangRupiah(70_000)).toBe('tujuh puluh ribu rupiah')
  })

  it('rejects negative and fractional values', () => {
    expect(() => terbilang(-1)).toThrow(RangeError)
    expect(() => terbilang(1.5)).toThrow(RangeError)
  })
})
