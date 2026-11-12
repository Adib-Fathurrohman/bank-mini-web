// Cash denominations accepted by the shift open/close endpoints, largest first.
export const DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100] as const

export type Denomination = (typeof DENOMINATIONS)[number]
export type DenominationCounts = Partial<Record<Denomination, number>>

export const MAX_DENOMINATION_QUANTITY = 100_000

export function totalOfCounts(counts: DenominationCounts): number {
  return DENOMINATIONS.reduce((sum, d) => sum + d * (counts[d] ?? 0), 0)
}

/** `{"20000": 1, "5000": 3}` for one transaction's `denominations`; zero quantities are left out. */
export function toNotesPayload(counts: DenominationCounts): Record<string, number> {
  return toDenominationsPayload(counts).denominations
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

/** `[{denomination, quantity}]` from the API (`drawer`, a transaction's `cash`) as counts. */
export function countsFromList(list: ReadonlyArray<{ denomination: number; quantity: number }> | null | undefined): DenominationCounts {
  const counts: DenominationCounts = {}
  for (const { denomination, quantity } of list ?? []) {
    if ((DENOMINATIONS as readonly number[]).includes(denomination) && quantity > 0) {
      counts[denomination as Denomination] = quantity
    }
  }
  return counts
}

/** Number of notes and coins in a count. */
export function pieceCount(counts: DenominationCounts): number {
  return DENOMINATIONS.reduce((sum, d) => sum + (counts[d] ?? 0), 0)
}

/** How much of the amount is still uncovered (positive), or too much (negative). */
export function remainderOf(amount: number, counts: DenominationCounts): number {
  return amount - totalOfCounts(counts)
}

/** True when the notes add up to exactly the amount (cash in gives no change). */
export function matchesAmount(amount: number, counts: DenominationCounts): boolean {
  return remainderOf(amount, counts) === 0
}

/** Rows where `counts` asks for more than `available` holds: `{denomination: {requested, available}}`. */
export function exceedsAvailable(
  counts: DenominationCounts,
  available: DenominationCounts,
): Partial<Record<Denomination, { requested: number; available: number }>> {
  const over: Partial<Record<Denomination, { requested: number; available: number }>> = {}
  for (const d of DENOMINATIONS) {
    const requested = counts[d] ?? 0
    const have = available[d] ?? 0
    if (requested > have) over[d] = { requested, available: have }
  }
  return over
}

const SEARCH_LIMIT = 200_000

/**
 * The largest notes that `available` allows and that add up to exactly `amount`
 * (like the backend's default for cash out). Greedy first, then a bounded search
 * when greedy cannot finish; null when the drawer cannot pay the amount.
 */
export function fillFromDrawer(amount: number, available: DenominationCounts): DenominationCounts | null {
  if (!Number.isInteger(amount) || amount <= 0) return null
  const failed = new Set<string>()
  let steps = 0

  function search(index: number, remaining: number): DenominationCounts | null {
    if (remaining === 0) return {}
    if (index >= DENOMINATIONS.length || steps++ > SEARCH_LIMIT) return null
    const key = `${index}:${remaining}`
    if (failed.has(key)) return null
    const d = DENOMINATIONS[index]!
    const most = Math.min(available[d] ?? 0, Math.floor(remaining / d))
    for (let quantity = most; quantity >= 0; quantity--) {
      const rest = search(index + 1, remaining - quantity * d)
      if (rest) return quantity > 0 ? { [d]: quantity, ...rest } : rest
    }
    failed.add(key)
    return null
  }

  return search(0, amount)
}

/** `2 × Rp50.000 · 3 × Rp5.000`, largest first; empty when there are no notes. */
export function describeNotes(list: ReadonlyArray<{ denomination: number; quantity: number }> | null | undefined): string {
  const counts = countsFromList(list)
  return DENOMINATIONS.filter((d) => counts[d])
    .map((d) => `${counts[d]} × ${'Rp' + new Intl.NumberFormat('id-ID').format(d)}`)
    .join(' · ')
}
