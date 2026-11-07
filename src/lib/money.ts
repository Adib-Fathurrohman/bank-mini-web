// Money is integer Rupiah everywhere in the API. Display as `Rp1.500.000`.

const grouping = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

export function formatRupiah(amount: number): string {
  const formatted = `Rp${grouping.format(Math.abs(amount))}`
  return amount < 0 ? `-${formatted}` : formatted
}

/** Parses what a user typed ("125.000", "Rp 125000") into an integer, or null if it has no digits. */
export function parseRupiahInput(input: string): number | null {
  const digits = input.replace(/\D/g, '')
  if (!digits) return null
  return Number.parseInt(digits, 10)
}

export const MAX_TRANSACTION_AMOUNT = 100_000_000

/**
 * Teller amount rule: integer 1–100.000.000 and a multiple of Rp100, because
 * cash is counted in denominations ≥ Rp100 (backend limitation L1).
 * Returns an Indonesian error message, or null when valid.
 */
export function validateTransactionAmount(amount: number | null): string | null {
  if (amount === null || !Number.isInteger(amount) || amount < 1) return 'Masukkan nominal.'
  if (amount > MAX_TRANSACTION_AMOUNT) return `Nominal maksimal ${formatRupiah(MAX_TRANSACTION_AMOUNT)}.`
  if (amount % 100 !== 0) return 'Nominal harus kelipatan Rp100.'
  return null
}
