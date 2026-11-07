import { Link } from 'react-router'
import type { DailyReport } from '@/api/types'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { buttonClass } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { formatShortDate } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { REPORT_STATUS_LABEL, REPORT_STATUS_TONE } from '@/features/teller/labels'
import { awaitingReview } from '../review'

/** Counted cash is meaningless while a shift runs, and stale after a rejection (L3). */
function counted(report: DailyReport): number | null {
  return report.status === 'open' || report.status === 'rejected' ? null : report.physical_balance
}

function ReviewLink({ report, compact = false }: { report: DailyReport; compact?: boolean }) {
  const review = awaitingReview(report.status)
  const label = review ? 'Tinjau' : 'Lihat'
  const name = `${report.teller?.full_name ?? 'laporan'} ${formatShortDate(report.report_date)}`
  if (compact) return <Icon name="chevronRight" className="size-4 text-ink-400" />
  return (
    <Link
      to={`/supervisor/reports/${report.id}`}
      className={buttonClass(review ? 'primary' : 'secondary', 'sm')}
      aria-label={`${label} laporan ${name}`}
    >
      {label}
    </Link>
  )
}

/** Daily reports as a ruled table on wide screens and a stacked list on phones. */
export function ReportTable({ rows }: { rows: DailyReport[] }) {
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
            <th scope="col" className="py-2 pr-3 pl-4 font-medium">
              Tanggal
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Teller
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Status
            </th>
            <th scope="col" className="hidden py-2 pr-3 text-right font-medium xl:table-cell">
              Setoran
            </th>
            <th scope="col" className="hidden py-2 pr-3 text-right font-medium xl:table-cell">
              Penarikan
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              Kas sistem
            </th>
            <th scope="col" className="hidden py-2 pr-3 text-right font-medium lg:table-cell">
              Uang fisik
            </th>
            <th scope="col" className="py-2 pr-4">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((r) => {
            const physical = counted(r)
            return (
              <tr key={r.id} className="hover:bg-ink-50/60">
                <td className="py-2.5 pr-3 pl-4 whitespace-nowrap text-ink-900">{formatShortDate(r.report_date)}</td>
                <td className="max-w-52 py-2.5 pr-3">
                  <span className="block truncate text-ink-900">{r.teller?.full_name ?? '—'}</span>
                  {r.teller?.class && <span className="text-xs text-ink-500">{r.teller.class}</span>}
                </td>
                <td className="py-2.5 pr-3">
                  <Badge tone={REPORT_STATUS_TONE[r.status]}>{REPORT_STATUS_LABEL[r.status]}</Badge>
                </td>
                <td className="hidden py-2.5 pr-3 text-right xl:table-cell">
                  <Amount value={r.total_deposit} sign size="sm" tone={r.total_deposit ? 'in' : 'muted'} className="font-normal" />
                </td>
                <td className="hidden py-2.5 pr-3 text-right xl:table-cell">
                  <Amount value={-r.total_withdrawal} sign size="sm" tone={r.total_withdrawal ? 'default' : 'muted'} className="font-normal" />
                </td>
                <td className="py-2.5 pr-3 text-right font-medium text-ink-900">{formatRupiah(r.system_balance ?? 0)}</td>
                <td className="hidden py-2.5 pr-3 text-right text-ink-700 lg:table-cell">
                  {physical === null ? '—' : formatRupiah(physical)}
                </td>
                <td className="py-2 pr-4 text-right">
                  <ReviewLink report={r} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-ink-100 md:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <Link to={`/supervisor/reports/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink-900">
                  {r.teller?.full_name ?? '—'} · {formatShortDate(r.report_date)}
                </span>
                <span className="text-xs text-ink-500">Kas sistem {formatRupiah(r.system_balance ?? 0)}</span>
              </span>
              <Badge tone={REPORT_STATUS_TONE[r.status]}>{REPORT_STATUS_LABEL[r.status]}</Badge>
              <ReviewLink report={r} compact />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
