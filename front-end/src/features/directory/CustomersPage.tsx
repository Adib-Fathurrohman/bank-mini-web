import { useMemo } from 'react'
import { Link } from 'react-router'
import type { CustomerFilters } from '@/api/endpoints/directory'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { FilterBar, FilterField, filterControl, SearchFilter } from '@/components/Filters'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { useCurrentUser } from '@/auth/context'
import { buttonClass } from '@/components/Button'
import { parseOption } from '@/features/audit/labels'
import {
  ACCOUNT_STATUS_LABEL,
  ACCOUNT_STATUS_TONE,
  ACTIVATION_LABEL,
  ACTIVATION_TONE,
  CLASSES,
  classLabel,
  GROUPS,
} from './labels'
import { useCustomers, useMajors } from './queries'

const STATUS_OPTIONS = ['active', 'suspended', 'closed'] as const
const ACTIVATION_OPTIONS = ['pending', 'activated'] as const

type Key = 'search' | 'major' | 'class' | 'group' | 'status' | 'activation'

/** Savings accounts, searchable by name, NIS or account number. Closed accounts are behind the status filter. */
export function CustomersPage() {
  const { get, update, clear, page, setPage, filtered } = useUrlFilters<Key>()
  const user = useCurrentUser()
  const majors = useMajors()
  const search = get('search')
  const majorId = get('major')
  const klass = parseOption(CLASSES, get('class'))
  const group = parseOption(GROUPS, get('group'))
  const status = parseOption(STATUS_OPTIONS, get('status'))
  const activation = parseOption(ACTIVATION_OPTIONS, get('activation'))

  const filters = useMemo<CustomerFilters>(
    () => ({
      search: search || undefined,
      major_id: majorId ? Number(majorId) : undefined,
      class: klass,
      group,
      // "Ditutup" accounts are soft-deleted, so they are a trashed filter rather than a status.
      status: status === 'closed' ? undefined : status,
      trashed: status === 'closed' ? 'only' : undefined,
      activation,
      page,
    }),
    [search, majorId, klass, group, status, activation, page],
  )
  const list = useCustomers(filters)
  const rows = list.data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nasabah"
        description="Rekening tabungan siswa, urut nama."
        actions={
          user.role === 'admin' && (
            <>
              <Link to="/admin/graduation" className={buttonClass('secondary')}>
                Kelulusan
              </Link>
              <Link to="/customers/new" className={buttonClass('primary')}>
                Buka rekening
              </Link>
            </>
          )
        }
      />

      <Panel className="overflow-hidden">
        <FilterBar>
          <FilterField id="customer-search" label="Cari" wide>
            <SearchFilter
              id="customer-search"
              value={search}
              placeholder="Nama, NIS, atau no. rekening"
              onChange={(value) => update({ search: value })}
            />
          </FilterField>
          <FilterField id="customer-major" label="Jurusan">
            <select id="customer-major" value={majorId} onChange={(e) => update({ major: e.target.value })} className={filterControl}>
              <option value="">Semua jurusan</option>
              {majors.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} · {m.major_name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="customer-class" label="Kelas">
            <select id="customer-class" value={klass ?? ''} onChange={(e) => update({ class: e.target.value })} className={filterControl}>
              <option value="">Semua</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="customer-group" label="Rombel">
            <select id="customer-group" value={group ?? ''} onChange={(e) => update({ group: e.target.value })} className={filterControl}>
              <option value="">Semua</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="customer-status" label="Status">
            <select id="customer-status" value={status ?? ''} onChange={(e) => update({ status: e.target.value })} className={filterControl}>
              <option value="">Aktif dan ditangguhkan</option>
              <option value="active">{ACCOUNT_STATUS_LABEL.active}</option>
              <option value="suspended">{ACCOUNT_STATUS_LABEL.suspended}</option>
              <option value="closed">{ACCOUNT_STATUS_LABEL.inactive}</option>
            </select>
          </FilterField>
          <FilterField id="customer-activation" label="Aplikasi">
            <select
              id="customer-activation"
              value={activation ?? ''}
              onChange={(e) => update({ activation: e.target.value })}
              className={filterControl}
            >
              <option value="">Semua</option>
              <option value="pending">{ACTIVATION_LABEL.pending}</option>
              <option value="activated">{ACTIVATION_LABEL.activated}</option>
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
          <EmptyState title={filtered ? 'Tidak ada nasabah yang cocok' : 'Belum ada nasabah'}>
            {filtered ? 'Ubah atau hapus filter.' : 'Rekening dibuka oleh administrator.'}
          </EmptyState>
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                  <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                    Nama
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Rekening
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
                    Kelas
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium xl:table-cell">
                    Aplikasi
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    Saldo
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    <span className="sr-only">Detail</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-ink-50/60">
                    <td className="max-w-60 py-2.5 pr-3 pl-4">
                      <span className="block truncate text-ink-900">{c.full_name}</span>
                      <span className="text-xs text-ink-500">NIS {c.nis}</span>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[13px] text-ink-700">{c.account_number}</td>
                    <td className="hidden py-2.5 pr-3 whitespace-nowrap text-ink-700 lg:table-cell">{classLabel(c)}</td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={ACCOUNT_STATUS_TONE[c.account_status]}>{ACCOUNT_STATUS_LABEL[c.account_status]}</Badge>
                    </td>
                    <td className="hidden py-2.5 pr-3 xl:table-cell">
                      <Badge tone={ACTIVATION_TONE[c.activation_status]}>{ACTIVATION_LABEL[c.activation_status]}</Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <Amount value={c.balance} size="sm" />
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <Link
                        to={`/customers/${c.id}`}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline"
                      >
                        Detail
                        <Icon name="chevronRight" className="size-3.5" />
                        <span className="sr-only">{c.full_name}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-ink-100 md:hidden">
              {rows.map((c) => (
                <li key={c.id}>
                  <Link to={`/customers/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink-900">{c.full_name}</span>
                      <span className="font-mono text-xs text-ink-500">{c.account_number}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <Amount value={c.balance} size="sm" />
                      <Badge tone={ACCOUNT_STATUS_TONE[c.account_status]}>{ACCOUNT_STATUS_LABEL[c.account_status]}</Badge>
                    </span>
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
