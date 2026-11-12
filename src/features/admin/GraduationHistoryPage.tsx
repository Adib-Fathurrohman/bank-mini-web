import { Link } from 'react-router'
import { useCurrentUser } from '@/auth/context'
import { buttonClass } from '@/components/Button'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { Icon } from '@/components/Icon'
import { formatDateTime } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { useGraduations } from './queries'

/** Past graduation runs, newest first. Admin and supervisor. */
export function GraduationHistoryPage() {
  const user = useCurrentUser()
  const { page, setPage } = useUrlFilters<never>()
  const list = useGraduations(page)
  const rows = list.data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riwayat kelulusan"
        description="Setiap kelulusan: berapa rekening ditutup dan berapa uang yang dibayarkan. Bukti pembayaran dapat dicetak ulang."
        actions={
          user.role === 'admin' && (
            <Link to="/admin/graduation" className={buttonClass('primary')}>
              Luluskan kelas
            </Link>
          )
        }
      />
      <Panel className="overflow-hidden">
        {list.isPending ? (
          <SkeletonRows />
        ) : list.error ? (
          <div className="p-4">
            <LoadError error={list.error} onRetry={() => void list.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="Belum ada kelulusan">Kelulusan yang dijalankan muncul di sini.</EmptyState>
        ) : (
          <ul className="divide-y divide-ink-100">
            {rows.map((g) => (
              <li key={g.id}>
                <Link to={`/graduations/${g.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-900">Kelulusan {g.label}</span>
                    <span className="text-[13px] text-ink-500">
                      {formatDateTime(g.created_at)}
                      {g.executed_by && ` · ${g.executed_by.full_name}`}
                    </span>
                  </span>
                  <span className="text-right text-sm">
                    <span className="block font-medium text-ink-900">{formatRupiah(g.total_amount)}</span>
                    <span className="text-[13px] text-ink-500">{g.customer_count} rekening</span>
                  </span>
                  <Icon name="chevronRight" className="size-4 text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {list.data && <Pagination meta={list.data.meta} onPage={setPage} />}
    </div>
  )
}
