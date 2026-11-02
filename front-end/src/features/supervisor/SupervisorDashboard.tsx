import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { DataList, DataRow } from '@/components/DataList'
import { PageHeader, Panel, Section } from '@/components/Page'
import { EmptyState, LoadError, Skeleton, SkeletonRows } from '@/components/QueryStatus'
import { useCurrentUser } from '@/auth/context'
import { formatDate, jakartaToday } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { ReportTable } from './components/ReportTable'
import { useTrialBalance } from '@/features/audit/queries'
import { useCashTransfers, useReportCount, useReports } from './queries'

/** One figure of the day's work, linking to the list behind it. Each loads and fails on its own. */
function Tile({
  label,
  to,
  value,
  loading,
  failed,
  highlight = false,
}: {
  label: string
  to: string
  value: ReactNode
  loading: boolean
  failed: boolean
  highlight?: boolean
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col gap-1 px-4 py-3 md:py-4 ${highlight ? 'bg-warn-50 hover:bg-warn-100' : 'bg-white hover:bg-ink-50'}`}
    >
      <span className="text-[13px] text-ink-500">{label}</span>
      {loading ? (
        <Skeleton className="h-7 w-16" />
      ) : failed ? (
        <span className="text-sm text-neg-700">Gagal dimuat</span>
      ) : (
        <span className="text-2xl font-semibold tracking-tight text-ink-900">{value}</span>
      )}
    </Link>
  )
}

/** Supervisor home: what waits for review, what runs, and today's cash into the vault. */
export function SupervisorDashboard() {
  const user = useCurrentUser()
  const today = jakartaToday()
  const pending = useReports({ status: 'submitted', per_page: 10 })
  const held = useReports({ status: 'on_hold', per_page: 5 })
  const running = useReportCount('open')
  const transfers = useCashTransfers({ from: today, to: today })
  const trial = useTrialBalance({ from: today, to: today })

  const pendingTotal = pending.data?.meta.total ?? 0
  const heldTotal = held.data?.meta.total ?? 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dasbor" description={`${formatDate(today)} · ${user.full_name}`} />

      <nav
        aria-label="Ringkasan hari ini"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 md:grid-cols-4"
      >
        <Tile
          label="Menunggu verifikasi"
          to="/supervisor/reports?status=submitted"
          value={pendingTotal}
          loading={pending.isPending}
          failed={Boolean(pending.error)}
          highlight={pendingTotal > 0}
        />
        <Tile
          label="Ditahan"
          to="/supervisor/reports?status=on_hold"
          value={heldTotal}
          loading={held.isPending}
          failed={Boolean(held.error)}
        />
        <Tile
          label="Shift berjalan"
          to="/supervisor/reports?status=open"
          value={running.data}
          loading={running.isPending}
          failed={Boolean(running.error)}
        />
        <Tile
          label="Masuk brankas hari ini"
          to="/supervisor/vault"
          value={transfers.data && <Amount value={transfers.data.total_amount} size="lg" />}
          loading={transfers.isPending}
          failed={Boolean(transfers.error)}
        />
      </nav>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Section
            title="Menunggu verifikasi"
            description="Tinjau satu per satu. Persetujuan memindahkan kas teller ke brankas."
            actions={
              pendingTotal > (pending.data?.data.length ?? 0) && (
                <Link to="/supervisor/reports?status=submitted" className="text-[13px] font-medium text-brand-700 hover:underline">
                  Lihat semua ({pendingTotal})
                </Link>
              )
            }
          >
            <Panel className="overflow-hidden">
              {pending.isPending ? (
                <SkeletonRows rows={3} />
              ) : pending.error ? (
                <div className="p-4">
                  <LoadError error={pending.error} onRetry={() => void pending.refetch()} />
                </div>
              ) : pending.data.data.length === 0 ? (
                <EmptyState title="Tidak ada laporan yang menunggu">
                  Laporan muncul di sini setelah teller menutup shift.
                </EmptyState>
              ) : (
                <ReportTable rows={pending.data.data} />
              )}
            </Panel>
          </Section>

          {held.data && held.data.data.length > 0 && (
            <Section title="Ditahan" description="Menunggu kelengkapan sebelum disetujui atau ditolak.">
              <Panel className="overflow-hidden">
                <ReportTable rows={held.data.data} />
              </Panel>
            </Section>
          )}
        </div>

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
            <div className="flex flex-col gap-2 py-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
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
      </div>
    </div>
  )
}
