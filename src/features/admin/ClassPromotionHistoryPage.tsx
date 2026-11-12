import { Link } from 'react-router'
import { useCurrentUser } from '@/auth/context'
import { buttonClass } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { formatDateTime } from '@/lib/datetime'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { useClassPromotions } from './queries'

/** Past class promotion runs, newest first. Admin and supervisor. */
export function ClassPromotionHistoryPage() {
  const user = useCurrentUser()
  const { page, setPage } = useUrlFilters<never>()
  const list = useClassPromotions(page)
  const rows = list.data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riwayat kenaikan kelas"
        description="Kenaikan kelas dijalankan sekali per tahun ajaran, setelah kelulusan kelas XII."
        actions={
          user.role === 'admin' && (
            <Link to="/admin/class-promotion" className={buttonClass('primary')}>
              Kenaikan kelas
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
          <EmptyState title="Belum ada kenaikan kelas">Kenaikan kelas yang dijalankan muncul di sini.</EmptyState>
        ) : (
          <ul className="divide-y divide-ink-100">
            {rows.map((p) => (
              <li key={p.id}>
                <Link to={`/class-promotions/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-900">Tahun ajaran {p.school_year}</span>
                    <span className="text-[13px] text-ink-500">
                      {formatDateTime(p.created_at)}
                      {p.executed_by && ` · ${p.executed_by.full_name}`}
                    </span>
                  </span>
                  <span className="text-right text-[13px] text-ink-600">
                    {p.promoted_count} naik · {p.retained_count} tinggal
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
