import type { DailyReport } from '@/api/types'
import { Amount } from '@/components/Amount'

/**
 * The shift as a ledger line: opening + deposits − withdrawals = cash the
 * system expects in the drawer. Live while the shift is active.
 */
export function ShiftSummary({ shift }: { shift: DailyReport }) {
  const cells = [
    { op: '', label: 'Saldo awal', value: <Amount value={shift.opening_balance} /> },
    { op: '+', label: 'Setoran', value: <Amount value={shift.total_deposit} tone="in" /> },
    { op: '−', label: 'Penarikan', value: <Amount value={shift.total_withdrawal} /> },
    { op: '=', label: 'Kas di laci (sistem)', value: <Amount value={shift.system_balance ?? 0} /> },
  ]
  return (
    <dl className="grid overflow-hidden rounded-lg border border-ink-200 bg-white md:grid-cols-4">
      {cells.map((cell, index) => (
        <div
          key={cell.label}
          className={`flex items-baseline justify-between gap-3 px-4 py-3 md:flex-col md:items-start md:gap-1 md:py-4 ${
            index > 0 ? 'border-t border-ink-200 md:border-t-0 md:border-l' : ''
          } ${index === 3 ? 'bg-ink-50' : ''}`}
        >
          <dt className="flex items-center gap-1.5 text-[13px] text-ink-500">
            {cell.op && (
              <span aria-hidden="true" className="w-3 text-center font-medium text-ink-400">
                {cell.op}
              </span>
            )}
            {cell.label}
          </dt>
          <dd className={index === 3 ? 'md:border-b-[3px] md:border-double md:border-ink-300 md:pb-0.5' : ''}>
            {cell.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
