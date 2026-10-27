// Indonesian number words ("terbilang"), lowercase like the backend's
// `amount_in_words`. Used to preview the amount in confirmation dialogs; after
// saving, always show the server's `amount_in_words`.

const UNITS = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

function belowThousand(n: number): string {
  if (n < 12) return UNITS[n]!
  if (n < 20) return `${UNITS[n - 10]} belas`
  if (n < 100) {
    const rest = n % 10
    return `${UNITS[Math.floor(n / 10)]} puluh${rest ? ` ${UNITS[rest]}` : ''}`
  }
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const head = hundreds === 1 ? 'seratus' : `${UNITS[hundreds]} ratus`
  return rest ? `${head} ${belowThousand(rest)}` : head
}

const SCALES: Array<[number, string]> = [
  [1_000_000_000_000, 'triliun'],
  [1_000_000_000, 'miliar'],
  [1_000_000, 'juta'],
  [1_000, 'ribu'],
]

export function terbilang(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`terbilang: unsupported value ${value}`)
  if (value === 0) return 'nol'

  const parts: string[] = []
  let rest = value
  for (const [size, name] of SCALES) {
    const chunk = Math.floor(rest / size)
    if (chunk === 0) continue
    rest %= size
    parts.push(size === 1_000 && chunk === 1 ? 'seribu' : `${terbilang(chunk)} ${name}`)
  }
  if (rest > 0) parts.push(belowThousand(rest))
  return parts.join(' ')
}

export function terbilangRupiah(amount: number): string {
  return `${terbilang(amount)} rupiah`
}
