import { Link, useParams } from 'react-router'
import { useCurrentUser } from '@/auth/context'
import { ROLE_LABEL } from '@/auth/session'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { buttonClass } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { LoadError, Loading } from '@/components/QueryStatus'
import { formatDateTime } from '@/lib/datetime'
import { useFlash } from '@/lib/flash'
import { StaffActions } from '@/features/admin/StaffActions'
import { useStaffMember } from './queries'

/** One staff account; for a teller, links to their transactions and reports. The admin can edit, block or delete it. */
export function StaffDetailPage() {
  const id = Number(useParams().id)
  const user = useCurrentUser()
  const query = useStaffMember(id)
  const flash = useFlash()

  const back = (
    <Link to="/staff" className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900">
      <Icon name="chevronLeft" className="size-3.5" />
      Staf
    </Link>
  )

  if (query.isPending) return <Loading />
  if (query.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Staf" back={back} />
        {query.error.kind === 'notFound' ? (
          <Alert title="Staf tidak ditemukan" />
        ) : (
          <LoadError error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    )
  }

  const s = query.data
  const teller = s.role === 'teller'

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        back={back}
        title={s.full_name}
        meta={<Badge tone={s.is_active ? 'success' : 'neutral'}>{s.is_active ? 'Aktif' : 'Diblokir'}</Badge>}
        description={ROLE_LABEL[s.role]}
        actions={
          <>
            {teller && (
              <Link to={`/audit/transactions?teller_id=${s.id}`} className={buttonClass('secondary')}>
                Transaksi di log audit
              </Link>
            )}
            {teller && user.role === 'supervisor' && (
              <Link to={`/supervisor/reports?teller=${s.id}`} className={buttonClass('secondary')}>
                Laporan harian
              </Link>
            )}
          </>
        }
      />
      {user.role === 'admin' && s.role !== 'admin' && (
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          <StaffActions staff={s} />
        </div>
      )}
      {flash && <Alert tone="success" title={flash} />}
      {user.role === 'admin' && s.role === 'admin' && (
        <Alert tone="info" title="Akun administrator">
          Akun administrator tidak dapat diubah, diblokir, atau dihapus dari aplikasi.
        </Alert>
      )}
      {!s.is_active && (
        <Alert tone="info" title="Akun diblokir">
          Staf ini tidak dapat masuk. Riwayatnya tetap tersimpan.
        </Alert>
      )}
      <Panel className="px-4">
        <DataList>
          <DataRow label="Username" mono>
            {s.username}
          </DataRow>
          <DataRow label="Nama lengkap">{s.full_name}</DataRow>
          <DataRow label="Peran">{ROLE_LABEL[s.role]}</DataRow>
          <DataRow label="Kelas">{s.class ?? '—'}</DataRow>
          <DataRow label="No. HP" mono>
            {s.phone ?? '—'}
          </DataRow>
          <DataRow label="Dibuat">{formatDateTime(s.created_at)}</DataRow>
        </DataList>
      </Panel>
    </div>
  )
}
