import { Link, useSearchParams } from 'react-router'
import { Amount } from '@/components/Amount'
import { Button } from '@/components/Button'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, Skeleton, SkeletonRows } from '@/components/QueryStatus'
import { formatDateTime, formatShortDate, jakartaToday } from '@/lib/datetime'
import { FilterBar, FilterField, filterControl, TellerSelect } from './components/Filters'
import { useCashTransfers } from './queries'

/** The vault ledger: cash booked from teller drawers by report approvals (read-only). */
export function VaultPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const tellerId = searchParams.get('teller') ?? ''
  const page = Number(searchParams.get('page') ?? '1') || 1
  const today = jakartaToday()

  const transfers = useCashTransfers({
    from: from || undefined,
    to: to || undefined,
    teller_id: tellerId ? Number(tellerId) : undefined,
    page,
  })

  function update(next: Partial<Record<'from' | 'to' | 'teller' | 'page', string>>) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    if (!('page' in next)) params.delete('page')
    setSearchParams(params)
  }

  const filtered = Boolean(from || to || tellerId)
  const rows = transfers.data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Brankas"
        description="Kas yang dipindahkan dari laci teller ke brankas utama. Tercatat otomatis saat laporan harian disetujui."
      />

      <Panel className="overflow-hidden">
        <FilterBar>
          <FilterField id="vault-from" label="Dari tanggal">
            <input
              id="vault-from"
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => update({ from: e.target.value })}
              className={filterControl}
            />
          </FilterField>
          <FilterField id="vault-to" label="Sampai tanggal">
            <input
              id="vault-to"
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => update({ to: e.target.value })}
              className={filterControl}
            />
          </FilterField>
          <FilterField id="vault-teller" label="Teller">
            <TellerSelect id="vault-teller" value={tellerId} onChange={(teller) => update({ teller })} />
          </FilterField>
          {filtered && (
            <Button variant="ghost" onClick={() => setSearchParams({})}>
              Hapus filter
            </Button>
          )}
          <div className="ml-auto flex flex-col items-end gap-0.5 text-right max-sm:w-full max-sm:items-start max-sm:text-left">
            <span className="text-xs font-medium text-ink-600">{filtered ? 'Total sesuai filter' : 'Total seluruhnya'}</span>
            {transfers.data ? (
              <span className="border-b-[3px] border-double border-ink-300 pb-0.5">
                <Amount value={transfers.data.total_amount} size="lg" />
              </span>
            ) : (
              <Skeleton className="h-7 w-32" />
            )}
          </div>
        </FilterBar>

        {transfers.isPending ? (
          <SkeletonRows />
        ) : transfers.error ? (
          <div className="p-4">
            <LoadError error={transfers.error} onRetry={() => void transfers.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={filtered ? 'Tidak ada setoran ke brankas yang cocok' : 'Brankas masih kosong'}>
            {filtered ? 'Ubah atau hapus filter.' : 'Setoran ke brankas tercatat saat Anda menyetujui laporan harian.'}
          </EmptyState>
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                  <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                    Waktu
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Teller
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Laporan
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
                    Disetujui oleh
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-ink-50/60">
                    <td className="py-2.5 pr-3 pl-4 whitespace-nowrap text-ink-700">{formatDateTime(t.transferred_at)}</td>
                    <td className="py-2.5 pr-3 text-ink-900">{t.daily_report.teller.full_name}</td>
                    <td className="py-2.5 pr-3">
                      <Link
                        to={`/supervisor/reports/${t.daily_report.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        Shift {formatShortDate(t.daily_report.report_date)}
                      </Link>
                    </td>
                    <td className="hidden py-2.5 pr-3 text-ink-700 lg:table-cell">{t.approved_by.full_name}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <Amount value={t.amount} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-ink-100 md:hidden">
              {rows.map((t) => (
                <li key={t.id}>
                  <Link to={`/supervisor/reports/${t.daily_report.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink-900">
                        {t.daily_report.teller.full_name} · shift {formatShortDate(t.daily_report.report_date)}
                      </span>
                      <span className="text-xs text-ink-500">
                        {formatDateTime(t.transferred_at)} · {t.approved_by.full_name}
                      </span>
                    </span>
                    <Amount value={t.amount} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      {transfers.data && transfers.data.meta.total > 0 && (
        <Pagination meta={transfers.data.meta} onPage={(p) => update({ page: p > 1 ? String(p) : '' })} />
      )}
    </div>
  )
}
