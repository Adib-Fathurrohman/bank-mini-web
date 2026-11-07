import type { CustomerSummary } from '@/api/types'
import { isInFuture } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'

// Checks done BEFORE the request is sent to the customer's app, so they are not
// asked to approve something that would be refused (the server repeats every
// check when creating the request and again on completion). Hints only.

export function withdrawalBlocker(
  customer: CustomerSummary,
  amount: number,
  minBalance: number,
  now: Date = new Date(),
): string | null {
  if (customer.account_status !== 'active') return 'Rekening tidak aktif untuk bertransaksi.'
  if (isInFuture(customer.pin_locked_until, now)) return 'PIN nasabah sedang diblokir sementara.'
  const max = Math.max(0, customer.balance - minBalance)
  if (amount > max) {
    return `Saldo tidak mencukupi. Saldo minimum ${formatRupiah(minBalance)} harus tetap tersisa; penarikan maksimal ${formatRupiah(max)}.`
  }
  return null
}
