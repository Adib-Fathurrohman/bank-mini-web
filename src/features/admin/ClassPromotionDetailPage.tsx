import { Link, useLocation, useParams } from 'react-router'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { DataList, DataRow } from '@/components/DataList'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { LoadError, Loading } from '@/components/QueryStatus'
import { formatDateTime } from '@/lib/datetime'
import { useClassPromotion } from './queries'

/** One class promotion run: counts and every account's change. Admin and supervisor. */
export function ClassPromotionDetailPage() {
  const { id = '' } = useParams()
  const justRan = Boolean((useLocation().state as { justRan?: boolean } | null)?.justRan)
  const query = useClassPromotion(id)

  const back = (
    <Link
      to="/class-promotions"
      className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900"
    >
      <Icon name="chevronLeft" className="size-3.5" />
      Riwayat kenaikan kelas
    </Link>
  )

  if (query.isPending) return <Loading />
  if (query.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Kenaikan Kelas" back={back} />
        {query.error.kind === 'notFound' ? (
          <Alert title="Data tidak ditemukan" />
        ) : (
          <LoadError error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    )
  }

  const p = query.data
  const items = p.items ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={back}
        title={`Kenaikan kelas ${p.school_year}`}
        description={`${formatDateTime(p.created_at)}${p.executed_by ? ` · dijalankan ${p.executed_by.full_name}` : ''}`}
      />
      {justRan && (
        <Alert tone="success" title={`${p.promoted_count} rekening naik kelas, ${p.retained_count} tinggal kelas`}>
          Kelas siswa sudah diperbarui. Nomor rekening, saldo, dan riwayat tidak berubah.
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                  Nama
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Kelas
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Hasil
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((item) => (
                <tr key={item.customer_id}>
                  <td className="max-w-60 py-2.5 pr-3 pl-4">
                    <Link to={`/customers/${item.customer_id}`} className="block truncate text-ink-900 hover:underline">
                      {item.full_name}
                    </Link>
                    <span className="font-mono text-xs text-ink-500">{item.account_number}</span>
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-ink-800">
                    {item.from_class} → {item.to_class}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={item.retained ? 'warning' : 'success'}>{item.retained ? 'Tinggal kelas' : 'Naik kelas'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel className="px-4">
          <DataList>
            <DataRow label="Tahun ajaran">{p.school_year}</DataRow>
            <DataRow label="Naik kelas">{p.promoted_count}</DataRow>
            <DataRow label="Tinggal kelas">{p.retained_count}</DataRow>
            {p.note && <DataRow label="Catatan">{p.note}</DataRow>}
          </DataList>
        </Panel>
      </div>
    </div>
  )
}
