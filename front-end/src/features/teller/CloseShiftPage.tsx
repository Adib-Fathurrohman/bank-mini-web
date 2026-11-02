import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { closeShift, fetchDailyReportPdf } from '@/api/endpoints/teller'
import type { ApiError } from '@/api/errors'
import type { DailyReport, Single } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { Button, buttonClass } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Dialog, DialogActions } from '@/components/Dialog'
import { Eyebrow, PageHeader, Panel } from '@/components/Page'
import { EmptyState, LoadError, Loading } from '@/components/QueryStatus'
import { formatDate, formatDateTime } from '@/lib/datetime'
import { toDenominationsPayload, totalOfCounts, type DenominationCounts } from '@/lib/denominations'
import { formatRupiah } from '@/lib/money'
import { usePdf } from '@/lib/usePdf'
import { DenominationCounter } from './components/DenominationCounter'
import { ShiftSummary } from './components/ShiftSummary'
import { GATE_LABEL, GATE_TONE, REPORT_STATUS_LABEL, REPORT_STATUS_TONE } from './labels'
import { useRefreshTeller, useShift } from './queries'

function signedRupiah(value: number): string {
  return value > 0 ? `+${formatRupiah(value)}` : value < 0 ? `−${formatRupiah(-value)}` : formatRupiah(0)
}

/** Counted vs expected, in words the teller acts on. */
function differenceVerdict(counted: number, difference: number): { tone: 'success' | 'error' | 'neutral'; text: string } {
  if (counted === 0) return { tone: 'neutral', text: 'Isi jumlah per pecahan untuk mencocokkan.' }
  if (difference === 0) return { tone: 'success', text: 'Sesuai dengan kas sistem.' }
  return difference < 0
    ? { tone: 'error', text: `Kurang ${formatRupiah(-difference)} dari kas sistem.` }
    : { tone: 'error', text: `Lebih ${formatRupiah(difference)} dari kas sistem.` }
}

function Submitted({ report }: { report: DailyReport }) {
  const pdf = usePdf()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Shift ${formatDate(report.report_date)} ditutup`}
        meta={<Badge tone={REPORT_STATUS_TONE[report.status]}>{REPORT_STATUS_LABEL[report.status]}</Badge>}
        actions={
          <>
            <Link to="/teller/history" className={buttonClass('secondary')}>
              Riwayat shift
            </Link>
            <Button
              icon="printer"
              loading={pdf.pendingKey !== null}
              onClick={() =>
                void pdf.open('report', () => fetchDailyReportPdf(report.id), `laporan-harian-${report.report_date}.pdf`)
              }
            >
              Cetak laporan harian
            </Button>
          </>
        }
      />
      <Alert tone="success" title="Laporan harian terkirim ke supervisor">
        Serahkan uang tunai dan laporan cetak kepada supervisor untuk diverifikasi. Setor dan tarik tunai terkunci sampai
        shift berikutnya.
      </Alert>
      {pdf.error && <Alert>{pdf.error.message}</Alert>}
      <ShiftSummary shift={report} />
      <Panel className="max-w-xl px-4 sm:px-5">
        <DataList>
          <DataRow label="Uang fisik">{formatRupiah(report.physical_balance ?? 0)}</DataRow>
          <DataRow label="Selisih">{signedRupiah(report.difference ?? 0)}</DataRow>
          <DataRow label="Transaksi">{report.transaction_count}</DataRow>
          {report.submitted_at && <DataRow label="Ditutup">{formatDateTime(report.submitted_at)}</DataRow>}
        </DataList>
      </Panel>
    </div>
  )
}

/** T8: count the drawer, compare with the system balance, and submit the daily report. */
export function CloseShiftPage() {
  const shift = useShift()
  const refresh = useRefreshTeller()
  const [counts, setCounts] = useState<DenominationCounts>({})
  const [confirming, setConfirming] = useState(false)
  const [closed, setClosed] = useState<DailyReport | null>(null)

  const mutation = useMutation<Single<DailyReport>, ApiError>({
    mutationFn: () => closeShift(toDenominationsPayload(counts)),
    onSuccess: ({ data }) => setClosed(data),
    onSettled: () => {
      setConfirming(false)
      void refresh()
    },
  })

  if (closed) return <Submitted report={closed} />
  if (shift.isPending) return <Loading label="Memuat status shift…" />
  if (shift.error) return <LoadError error={shift.error} onRetry={() => void shift.refetch()} />

  const gate = shift.data
  if (gate.kind === 'none' || gate.kind === 'closedToday') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Tutup shift" />
        <Panel>
          <EmptyState
            title={gate.kind === 'none' ? 'Belum ada shift yang dibuka' : 'Shift hari ini sudah ditutup'}
            action={
              <Link
                to={gate.kind === 'none' ? '/teller' : '/teller/history'}
                className={buttonClass('secondary', 'sm')}
              >
                {gate.kind === 'none' ? 'Buka shift' : 'Lihat riwayat shift'}
              </Link>
            }
          >
            {gate.kind === 'none'
              ? 'Penutupan dilakukan di akhir hari, setelah shift dibuka dan melayani nasabah.'
              : 'Laporan harian menunggu verifikasi supervisor.'}
          </EmptyState>
        </Panel>
      </div>
    )
  }

  const report = gate.shift
  const systemBalance = report.system_balance ?? 0
  const counted = totalOfCounts(counts)
  const difference = counted - systemBalance
  const verdict = differenceVerdict(counted, difference)
  const error = mutation.error

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.reset()
    setConfirming(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={gate.kind === 'rejected' ? 'Tutup shift kembali' : 'Tutup shift'}
        meta={<Badge tone={GATE_TONE[gate.kind]}>{GATE_LABEL[gate.kind]}</Badge>}
        description={`Shift ${formatDate(report.report_date)}. Hitung uang fisik di laci; jumlahnya harus sama dengan kas sistem.`}
      />

      {report.status === 'rejected' && (
        <Alert tone="error" title="Laporan sebelumnya ditolak supervisor">
          {report.supervisor_note && <p>“{report.supervisor_note}”</p>}
          {/* Stale values from the rejected close (limitation L3). */}
          {report.physical_balance !== null && (
            <p className="mt-1">Hitungan yang ditolak: {formatRupiah(report.physical_balance)}. Hitung ulang dari awal.</p>
          )}
        </Alert>
      )}

      <ShiftSummary shift={report} />

      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel className="px-4 pt-2 pb-4 sm:px-5">
          <DenominationCounter
            counts={counts}
            onChange={(next) => {
              setCounts(next)
              // A refusal was about the previous count.
              if (mutation.isError) mutation.reset()
            }}
            disabled={mutation.isPending}
          />
        </Panel>

        <Panel className="flex flex-col gap-4 p-4 sm:p-5 lg:sticky lg:top-6">
          <Eyebrow>Pencocokan kas</Eyebrow>
          <DataList className="-mt-2">
            <DataRow label="Kas sistem">{formatRupiah(systemBalance)}</DataRow>
            <DataRow label="Uang fisik">{formatRupiah(counted)}</DataRow>
          </DataList>
          <div className="border-t border-ink-200 pt-3">
            <p className="text-[13px] text-ink-500">Selisih</p>
            <Amount
              value={difference}
              sign
              size="lg"
              tone={counted === 0 ? 'muted' : difference === 0 ? 'in' : 'danger'}
            />
            <p
              aria-live="polite"
              className={`mt-1 text-[13px] ${
                verdict.tone === 'success' ? 'text-pos-700' : verdict.tone === 'error' ? 'text-neg-700' : 'text-ink-500'
              }`}
            >
              {verdict.text}
            </p>
          </div>

          {error &&
            !confirming &&
            (error.kind === 'cashMismatch' && error.cashMismatch ? (
              <Alert title="Uang fisik tidak sesuai">
                <p>{error.message}</p>
                <p className="mt-1">
                  Sistem {formatRupiah(error.cashMismatch.system_balance)} · fisik{' '}
                  {formatRupiah(error.cashMismatch.physical_balance)} · selisih{' '}
                  {signedRupiah(error.cashMismatch.difference)}
                </p>
                <p className="mt-1">Hitung ulang, periksa slip, atau koreksi transaksi yang salah.</p>
              </Alert>
            ) : (
              <Alert title="Shift tidak ditutup">{error.fieldUnder('denominations') ?? error.message}</Alert>
            ))}

          <Button type="submit" size="lg" className="w-full" icon="lock">
            Tutup shift
          </Button>
        </Panel>
      </form>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        dismissable={!mutation.isPending}
        title="Tutup shift sekarang?"
        description="Setelah ditutup, setor dan tarik tunai terkunci sampai supervisor memeriksa laporan."
        size="sm"
      >
        <DataList>
          <DataRow label="Kas sistem">{formatRupiah(systemBalance)}</DataRow>
          <DataRow label="Uang fisik">{formatRupiah(counted)}</DataRow>
          <DataRow label="Selisih" strong>
            <span className={difference === 0 ? 'text-pos-700' : 'text-neg-700'}>{signedRupiah(difference)}</span>
          </DataRow>
        </DataList>
        {difference !== 0 && (
          <Alert tone="warning">Hitungan belum sama dengan kas sistem; server akan menolak penutupan.</Alert>
        )}
        <p className="text-[13px] text-ink-500">Permintaan penarikan yang belum selesai dibatalkan otomatis.</p>
        <DialogActions>
          <Button variant="secondary" disabled={mutation.isPending} onClick={() => setConfirming(false)}>
            Hitung ulang
          </Button>
          <Button data-autofocus loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Tutup shift
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
