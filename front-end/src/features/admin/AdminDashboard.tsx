import { Link } from 'react-router'
import { useCurrentUser } from '@/auth/context'
import { Badge } from '@/components/Badge'
import { buttonClass } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Icon, type IconName } from '@/components/Icon'
import { PageHeader, Panel, Section } from '@/components/Page'
import { LoadError, Skeleton } from '@/components/QueryStatus'
import { StatTile, StatTiles } from '@/components/StatTile'
import { formatDate, jakartaToday } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { useTrialBalance } from '@/features/audit/queries'
import { useCustomerCount, useStaffCount } from './queries'

const TASKS: { to: string; label: string; description: string; icon: IconName }[] = [
  { to: '/customers/new', label: 'Buka rekening', description: 'Siswa baru, undangan aplikasi lewat email', icon: 'plus' },
  { to: '/staff/new', label: 'Tambah staf', description: 'Teller atau supervisor', icon: 'users' },
  { to: '/staff/import', label: 'Impor staf', description: 'Daftar piket dari Excel atau CSV', icon: 'upload' },
  { to: '/admin/graduation', label: 'Kelulusan', description: 'Tutup rekening siswa yang lulus', icon: 'graduation' },
  { to: '/admin/settings', label: 'Pengaturan', description: 'Saldo minimum, pemindai QR, verifikasi', icon: 'settings' },
  { to: '/reports', label: 'Laporan', description: 'Laporan tahunan, jejak audit, jurnal (PDF)', icon: 'printer' },
]

/** StatTile props from a count query. */
function figure(query: { data?: number; isPending: boolean; error: unknown }) {
  return { value: query.data, loading: query.isPending, failed: Boolean(query.error) }
}

/** Admin home: account and staff figures, today's trial balance, and the admin's tasks. */
export function AdminDashboard() {
  const user = useCurrentUser()
  const today = jakartaToday()
  const active = useCustomerCount({ status: 'active' })
  const suspended = useCustomerCount({ status: 'suspended' })
  const pending = useCustomerCount({ activation: 'pending' })
  const closed = useCustomerCount({ trashed: 'only' })
  const tellers = useStaffCount({ role: 'teller' })
  const supervisors = useStaffCount({ role: 'supervisor' })
  const trial = useTrialBalance({ from: today, to: today })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Beranda" description={`${formatDate(today)} · ${user.full_name}`} />

      <StatTiles label="Rekening nasabah">
        <StatTile label="Nasabah aktif" to="/customers?status=active" {...figure(active)} />
        <StatTile label="Ditangguhkan" to="/customers?status=suspended" {...figure(suspended)} />
        <StatTile
          label="Belum aktivasi aplikasi"
          to="/customers?activation=pending"
          {...figure(pending)}
          highlight={(pending.data ?? 0) > 0}
        />
        <StatTile label="Ditutup (lulus)" to="/customers?status=closed" {...figure(closed)} />
      </StatTiles>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Section title="Tugas administrator">
          <ul className="grid gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 sm:grid-cols-2">
            {TASKS.map((task) => (
              <li key={task.to} className="bg-white">
                <Link to={task.to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-ink-50">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                    <Icon name={task.icon} className="size-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-900">{task.label}</span>
                    <span className="block text-[13px] text-ink-500">{task.description}</span>
                  </span>
                  <Icon name="chevronRight" className="ml-auto size-4 text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <div className="flex flex-col gap-4">
          <Panel className="px-4 pt-3 pb-1">
            <h2 className="text-[15px] font-semibold text-ink-900">Staf aktif</h2>
            <DataList>
              <DataRow label="Teller">{tellers.isPending ? <Skeleton className="h-4 w-6" /> : (tellers.data ?? '—')}</DataRow>
              <DataRow label="Supervisor">
                {supervisors.isPending ? <Skeleton className="h-4 w-6" /> : (supervisors.data ?? '—')}
              </DataRow>
            </DataList>
          </Panel>
          <Panel className="flex flex-col gap-1 px-4 pt-3 pb-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-ink-900">Neraca saldo hari ini</h2>
              {trial.data && (
                <Badge tone={trial.data.is_balanced ? 'success' : 'danger'}>
                  {trial.data.is_balanced ? 'Seimbang' : 'Tidak seimbang'}
                </Badge>
              )}
            </div>
            {trial.isPending ? (
              <Skeleton className="my-3 h-4 w-full" />
            ) : trial.error ? (
              <div className="py-3">
                <LoadError error={trial.error} onRetry={() => void trial.refetch()} />
              </div>
            ) : (
              <DataList>
                <DataRow label="Total debit">{formatRupiah(trial.data.total_debit)}</DataRow>
                <DataRow label="Total kredit">{formatRupiah(trial.data.total_credit)}</DataRow>
              </DataList>
            )}
          </Panel>
          <Link to="/audit/journals" className={buttonClass('ghost', 'sm', 'self-start')}>
            Lihat jurnal
          </Link>
        </div>
      </div>
    </div>
  )
}
