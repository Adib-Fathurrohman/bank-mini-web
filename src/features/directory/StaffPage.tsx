import { useMemo } from 'react'
import { Link } from 'react-router'
import type { StaffFilters } from '@/api/endpoints/directory'
import type { StaffRole } from '@/api/types'
import { ROLE_LABEL } from '@/auth/session'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { FilterBar, FilterField, filterControl, SearchFilter } from '@/components/Filters'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { useFlash } from '@/lib/flash'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { useCurrentUser } from '@/auth/context'
import { Alert } from '@/components/Alert'
import { buttonClass } from '@/components/Button'
import { parseOption } from '@/features/audit/labels'
import { useStaffList } from './queries'

const ROLES: StaffRole[] = ['teller', 'supervisor', 'admin']
const STATUSES = ['inactive', 'all'] as const

/** Staff accounts (sorted by name). Active ones by default, blocked ones behind the status filter; the admin adds and imports here. */
export function StaffPage() {
  const { get, update, clear, page, setPage, filtered } = useUrlFilters<'search' | 'role' | 'status'>()
  const user = useCurrentUser()
  const flash = useFlash()
  const search = get('search')
  const role = parseOption(ROLES, get('role'))
  const status = parseOption(STATUSES, get('status'))

  const filters = useMemo<StaffFilters>(
    () => ({ search: search || undefined, role, status: status ?? 'active', page }),
    [search, role, status, page],
  )
  const list = useStaffList(filters)
  const rows = list.data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staf"
        description="Akun teller, supervisor, dan administrator."
        actions={
          user.role === 'admin' && (
            <>
              <Link to="/staff/import" className={buttonClass('secondary')}>
                Impor
              </Link>
              <Link to="/staff/new" className={buttonClass('primary')}>
                Tambah staf
              </Link>
            </>
          )
        }
      />
      {flash && <Alert tone="success" title={flash} />}

      <Panel className="overflow-hidden">
        <FilterBar>
          <FilterField id="staff-search" label="Cari" wide>
            <SearchFilter id="staff-search" value={search} placeholder="Nama atau username" onChange={(value) => update({ search: value })} />
          </FilterField>
          <FilterField id="staff-role" label="Peran">
            <select id="staff-role" value={role ?? ''} onChange={(e) => update({ role: e.target.value })} className={filterControl}>
              <option value="">Semua peran</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="staff-status" label="Status">
            <select id="staff-status" value={status ?? ''} onChange={(e) => update({ status: e.target.value })} className={filterControl}>
              <option value="">Aktif</option>
              <option value="inactive">Diblokir</option>
              <option value="all">Semua</option>
            </select>
          </FilterField>
          {filtered && (
            <Button variant="ghost" onClick={clear}>
              Hapus filter
            </Button>
          )}
        </FilterBar>

        {list.isPending ? (
          <SkeletonRows />
        ) : list.error ? (
          <div className="p-4">
            <LoadError error={list.error} onRetry={() => void list.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="Tidak ada staf yang cocok">Ubah atau hapus filter.</EmptyState>
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                  <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                    Nama
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Peran
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
                    Kelas
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
                    No. HP
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    <span className="sr-only">Detail</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-ink-50/60">
                    <td className="max-w-64 py-2.5 pr-3 pl-4">
                      <span className="block truncate text-ink-900">{s.full_name}</span>
                      <span className="font-mono text-xs text-ink-500">{s.username}</span>
                      {s.email && !s.email_verified && (
                        <span className="ml-2 align-middle">
                          <Badge tone="warning">Email belum diverifikasi</Badge>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-ink-700">{ROLE_LABEL[s.role]}</td>
                    <td className="hidden py-2.5 pr-3 text-ink-700 lg:table-cell">{s.class ?? '—'}</td>
                    <td className="hidden py-2.5 pr-3 font-mono text-[13px] text-ink-700 lg:table-cell">{s.phone ?? '—'}</td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={s.is_active ? 'success' : 'neutral'}>{s.is_active ? 'Aktif' : 'Diblokir'}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <Link
                        to={`/staff/${s.id}`}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline"
                      >
                        Detail
                        <Icon name="chevronRight" className="size-3.5" />
                        <span className="sr-only">{s.full_name}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-ink-100 md:hidden">
              {rows.map((s) => (
                <li key={s.id}>
                  <Link to={`/staff/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink-900">{s.full_name}</span>
                      <span className="text-xs text-ink-500">
                        {ROLE_LABEL[s.role]} · <span className="font-mono">{s.username}</span>
                      </span>
                    </span>
                    <Badge tone={s.is_active ? 'success' : 'neutral'}>{s.is_active ? 'Aktif' : 'Diblokir'}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      {list.data && <Pagination meta={list.data.meta} onPage={setPage} />}
    </div>
  )
}
