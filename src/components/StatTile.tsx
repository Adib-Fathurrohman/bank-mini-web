import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Skeleton } from './QueryStatus'

/** A row of figures split by hairlines; two per row on phones. */
export function StatTiles({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label} className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 md:grid-cols-4">
      {children}
    </nav>
  )
}

/** One figure, linking to the list behind it. Each loads and fails on its own. */
export function StatTile({
  label,
  to,
  value,
  loading,
  failed,
  highlight = false,
}: {
  label: string
  to: string
  value: ReactNode
  loading: boolean
  failed: boolean
  highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col gap-1 px-4 py-3 md:py-4 ${highlight ? 'bg-warn-50 hover:bg-warn-100' : 'bg-white hover:bg-ink-50'}`}
    >
      <span className="text-[13px] text-ink-500">{label}</span>
      {loading ? (
        <Skeleton className="h-7 w-16" />
      ) : failed ? (
        <span className="text-sm text-neg-700">Gagal dimuat</span>
      ) : (
        <span className="text-2xl font-semibold tracking-tight text-ink-900">{value}</span>
      )}
    </Link>
  )
}
