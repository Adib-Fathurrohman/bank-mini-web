import { useMemo } from 'react'
import { Link } from 'react-router'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { buttonClass } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel, Section } from '@/components/Page'
import { EmptyState, LoadError, Loading } from '@/components/QueryStatus'
import { formatDate, formatTime } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { ShiftSummary } from './components/ShiftSummary'
import { TransactionTable } from './components/TransactionTable'
import { correctedIds } from './correctionEligibility'
import { GATE_LABEL, GATE_TONE } from './labels'
import { OpenShiftForm } from './OpenShiftForm'
import { useShift } from './queries'
import { canTransact, type ShiftGate } from './shiftGate'

const RECENT = 8

function ClosedToday() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Shift" meta={<Badge tone="neutral">Ditutup hari ini</Badge>} />
      <Panel>
        <EmptyState
          title="Shift hari ini sudah ditutup"
          action={
            <Link to="/teller/history" className={buttonClass('secondary')}>
              Lihat riwayat shift
            </Link>
          }
        >
          Laporan harian menunggu verifikasi supervisor. Setor dan tarik tunai dibuka lagi pada shift berikutnya, atau
          jika supervisor mengembalikan laporan.
        </EmptyState>
      </Panel>
    </div>
  )
}

function ActiveShift({ gate }: { gate: Extract<ShiftGate, { shift: unknown }> }) {
  const { shift, transactions } = gate
  const corrected = useMemo(() => correctedIds(transactions), [transactions])
  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, RECENT),
    [transactions],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Shift ${formatDate(shift.report_date)}`}
        meta={<Badge tone={GATE_TONE[gate.kind]}>{GATE_LABEL[gate.kind]}</Badge>}
        description={shift.opened_at && `Dibuka pukul ${formatTime(shift.opened_at)} WIB.`}
        actions={
          <>
            <Link to="/teller/close" className={buttonClass('secondary')}>
              {gate.kind === 'rejected' ? 'Tutup shift kembali' : 'Tutup shift'}
            </Link>
            {canTransact(gate) && (
              <Link to="/teller/counter" className={buttonClass('primary')}>
                <Icon name="userSearch" />
                Layani nasabah
              </Link>
            )}
          </>
        }
      />

      {gate.kind === 'stale' && (
        <Alert
          tone="warning"
          title={`Shift tanggal ${formatDate(shift.report_date)} belum ditutup`}
          action={
            <Link to="/teller/close" className={buttonClass('secondary', 'sm')}>
              Tutup shift itu
            </Link>
          }
        >
          Sampai shift itu ditutup, hanya koreksi dan penutupan shift yang dapat dilakukan. Shift hari ini dibuka
          setelahnya.
        </Alert>
      )}

      {gate.kind === 'rejected' && (
        <Alert tone="error" title="Laporan dikembalikan supervisor">
          {shift.supervisor_note && (
            <p>
              “{shift.supervisor_note}”{shift.supervisor && <span className="text-neg-700"> — {shift.supervisor.full_name}</span>}
            </p>
          )}
          <ol className="mt-2 list-decimal space-y-0.5 pl-5">
            <li>
              Periksa transaksi dan{' '}
              <Link to="/teller/transactions" className="font-medium underline underline-offset-2">
                lakukan koreksi
              </Link>{' '}
              bila ada yang salah.
            </li>
            <li>Hitung ulang uang di laci.</li>
            <li>
              <Link to="/teller/close" className="font-medium underline underline-offset-2">
                Tutup shift kembali
              </Link>
              . Setor dan tarik tunai tetap dapat dilakukan sampai itu.
            </li>
          </ol>
          {shift.physical_balance !== null && (
            // Stale values from the rejected close (limitation L3).
            <p className="mt-2 text-[13px]">Hitungan yang ditolak: {formatRupiah(shift.physical_balance)}.</p>
          )}
        </Alert>
      )}

      <ShiftSummary shift={shift} />

      <Section
        title="Transaksi shift ini"
        description={`${shift.transaction_count} transaksi, termasuk koreksi.`}
        actions={
          transactions.length > 0 && (
            <Link to="/teller/transactions" className={buttonClass('ghost', 'sm')}>
              Semua transaksi
              <Icon name="chevronRight" />
            </Link>
          )
        }
      >
        <Panel className="overflow-hidden">
          {recent.length === 0 ? (
            <EmptyState
              title="Belum ada transaksi"
              action={
                canTransact(gate) && (
                  <Link to="/teller/counter" className={buttonClass('secondary', 'sm')}>
                    Layani nasabah pertama
                  </Link>
                )
              }
            >
              Setoran dan penarikan shift ini akan muncul di sini.
            </EmptyState>
          ) : (
            <TransactionTable rows={recent} corrected={corrected} detailed={false} />
          )}
        </Panel>
      </Section>
    </div>
  )
}

/** Teller start page: renders the shift gate. */
export function TellerHomePage() {
  const { data: gate, isPending, error, refetch } = useShift()

  if (isPending) return <Loading label="Memuat status shift…" />
  if (error) return <LoadError error={error} onRetry={() => void refetch()} />
  if (gate.kind === 'none') return <OpenShiftForm />
  if (gate.kind === 'closedToday') return <ClosedToday />
  return <ActiveShift gate={gate} />
}
