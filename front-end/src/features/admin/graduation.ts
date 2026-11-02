import type { Customer } from '@/api/types'

export type GraduationOutcome = { status: 'closed' } | { status: 'failed'; message: string }

/** What the admin is about to close: how many accounts, and how much money would stay behind. */
export function summarizeSelection(rows: Customer[], selected: ReadonlySet<number>) {
  const chosen = rows.filter((r) => selected.has(r.id))
  const withBalance = chosen.filter((r) => r.balance > 0)
  return {
    count: chosen.length,
    withBalance: withBalance.length,
    remaining: withBalance.reduce((sum, r) => sum + r.balance, 0),
  }
}

/**
 * Closes accounts one at a time with the single-account endpoint (the backend has
 * no bulk graduation). A failure does not stop the rest; it is reported per account.
 */
export async function closeOneByOne(
  ids: number[],
  close: (id: number) => Promise<unknown>,
  onResult: (id: number, outcome: GraduationOutcome) => void,
): Promise<void> {
  for (const id of ids) {
    try {
      await close(id)
      onResult(id, { status: 'closed' })
    } catch (error) {
      onResult(id, { status: 'failed', message: error instanceof Error ? error.message : 'Gagal ditutup.' })
    }
  }
}
