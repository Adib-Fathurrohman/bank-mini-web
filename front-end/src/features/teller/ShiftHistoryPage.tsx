import { Link, useSearchParams } from 'react-router'
import type { DailyReport } from '@/api/types'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { formatDate, formatShortDate } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { REPORT_STATUS_LABEL, REPORT_STATUS_TONE } from './labels'
import { useDailyReports } from './queries'

/** Hidden while active: a rejected shift still carries the old count (L3). */
function physical(r: DailyReport): string {
  return r.status === 'open' || r.status === 'rejected' || r.physical_balance === null
    ? '—'
    : formatRupiah(r.physical_balance)
}

/** T10: the teller's own shifts, newest first. */
export function ShiftHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const reports = useDailyReports(page)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Riwayat shift" description="Laporan harian Anda dan status verifikasinya." />

      <Panel className="overflow-hidden">
        {reports.isPending ? (
          <SkeletonRows />
        ) : reports.error ? (
          <div className="p-4">
            <LoadError error={reports.error} onRetry={() => void reports.refetch()} />
          </div>
        ) : reports.data.data.length === 0 ? (
          <EmptyState title="Belum ada shift">Shift yang Anda buka akan tercatat di sini.</EmptyState>
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                  <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                    Tanggal
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-medium lg:table-cell">
                    Saldo awal
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    Setoran
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    Penarikan
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    Kas sistem
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-medium lg:table-cell">
                    Uang fisik
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    <span className="sr-only">Detail</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {reports.data.data.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-50/60">
                    <td className="py-2.5 pr-3 pl-4 text-ink-900">{formatDate(r.report_date)}</td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={REPORT_STATUS_TONE[r.status]}>{REPORT_STATUS_LABEL[r.status]}</Badge>
                    </td>
                    <td className="hidden py-2.5 pr-3 text-right text-ink-700 lg:table-cell">
                      {formatRupiah(r.opening_balance)}
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <Amount value={r.total_deposit} sign size="sm" tone={r.total_deposit ? 'in' : 'muted'} className="font-normal" />
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <Amount value={-r.total_withdrawal} sign size="sm" tone={r.total_withdrawal ? 'default' : 'muted'} className="font-normal" />
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium text-ink-900">
                      {formatRupiah(r.system_balance ?? 0)}
                    </td>
                    <td className="hidden py-2.5 pr-3 text-right text-ink-700 lg:table-cell">{physical(r)}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <Link
                        to={`/teller/history/${r.id}`}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline"
                      >
                        Detail
                        <Icon name="chevronRight" className="size-3.5" />
                        <span className="sr-only">shift {formatShortDate(r.report_date)}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-ink-100 md:hidden">
              {reports.data.data.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/teller/history/${r.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink-900">{formatShortDate(r.report_date)}</span>
                      <span className="text-xs text-ink-500">
                        Kas sistem {formatRupiah(r.system_balance ?? 0)} · {r.transaction_count} transaksi
                      </span>
                    </span>
                    <Badge tone={REPORT_STATUS_TONE[r.status]}>{REPORT_STATUS_LABEL[r.status]}</Badge>
                    <Icon name="chevronRight" className="size-4 text-ink-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
      {reports.data && (
        <Pagination meta={reports.data.meta} onPage={(p) => setSearchParams(p > 1 ? { page: String(p) } : {})} />
      )}
    </div>
  )
}
