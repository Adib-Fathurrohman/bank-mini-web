// Cash denominations accepted by the shift open/close endpoints, largest first.
export const DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100] as const

export type Denomination = (typeof DENOMINATIONS)[number]
export type DenominationCounts = Partial<Record<Denomination, number>>

export const MAX_DENOMINATION_QUANTITY = 100_000

export function totalOfCounts(counts: DenominationCounts): number {
  return DENOMINATIONS.reduce((sum, d) => sum + d * (counts[d] ?? 0), 0)
}

/** Request body for `POST /teller/shift/open|close`; zero quantities are left out. */
export function toDenominationsPayload(counts: DenominationCounts): { denominations: Record<string, number> } {
  const denominations: Record<string, number> = {}
  for (const d of DENOMINATIONS) {
    const quantity = counts[d] ?? 0
    if (quantity > 0) denominations[String(d)] = quantity
  }
  return { denominations }
}
