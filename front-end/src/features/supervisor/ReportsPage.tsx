import { useSearchParams } from 'react-router'
import type { DailyReportStatus } from '@/api/types'
import { Button } from '@/components/Button'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { jakartaToday } from '@/lib/datetime'
import { REPORT_STATUS_LABEL } from '@/features/teller/labels'
import { FilterBar, FilterField, filterControl, TellerSelect } from './components/Filters'
import { ReportTable } from './components/ReportTable'
import { useReports } from './queries'

const STATUSES: DailyReportStatus[] = ['submitted', 'on_hold', 'open', 'rejected', 'approved']

function parseStatus(value: string | null): DailyReportStatus | undefined {
  return STATUSES.find((s) => s === value)
}

/** All tellers' daily reports, filtered by status, date and teller (kept in the URL). */
export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseStatus(searchParams.get('status'))
  const date = searchParams.get('date') ?? ''
  const tellerId = searchParams.get('teller') ?? ''
  const page = Number(searchParams.get('page') ?? '1') || 1

  const reports = useReports({
    status,
    date: date || undefined,
    teller_id: tellerId ? Number(tellerId) : undefined,
    page,
  })

  function update(next: Partial<Record<'status' | 'date' | 'teller' | 'page', string>>) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    // A new filter starts again from the first page.
    if (!('page' in next)) params.delete('page')
    setSearchParams(params)
  }

  const filtered = Boolean(status || date || tellerId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Laporan harian"
        description="Laporan penutupan shift semua teller. Shift yang masih berjalan menampilkan total sementara."
      />

      <Panel className="overflow-hidden">
        <FilterBar>
          <FilterField id="report-status" label="Status">
            <select
              id="report-status"
              value={status ?? ''}
              onChange={(e) => update({ status: e.target.value })}
              className={filterControl}
            >
              <option value="">Semua status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REPORT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="report-date" label="Tanggal">
            <input
              id="report-date"
              type="date"
              value={date}
              max={jakartaToday()}
              onChange={(e) => update({ date: e.target.value })}
              className={filterControl}
            />
          </FilterField>
          <FilterField id="report-teller" label="Teller">
            <TellerSelect id="report-teller" value={tellerId} onChange={(teller) => update({ teller })} />
          </FilterField>
          {filtered && (
            <Button variant="ghost" onClick={() => setSearchParams({})}>
              Hapus filter
            </Button>
          )}
        </FilterBar>

        {reports.isPending ? (
          <SkeletonRows />
        ) : reports.error ? (
          <div className="p-4">
            <LoadError error={reports.error} onRetry={() => void reports.refetch()} />
          </div>
        ) : reports.data.data.length === 0 ? (
          <EmptyState title={filtered ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan'}>
            {filtered ? 'Ubah atau hapus filter untuk melihat laporan lain.' : 'Laporan dibuat saat teller membuka shift.'}
          </EmptyState>
        ) : (
          <ReportTable rows={reports.data.data} />
        )}
      </Panel>

      {reports.data && reports.data.meta.total > 0 && (
        <Pagination meta={reports.data.meta} onPage={(p) => update({ page: p > 1 ? String(p) : '' })} />
      )}
    </div>
  )
}
