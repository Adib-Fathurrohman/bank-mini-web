import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { fetchReportPdf, type ReviewDecision } from '@/api/endpoints/supervisor'
import type { DailyReport } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { Button, buttonClass } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel, Section } from '@/components/Page'
import { EmptyState, LoadError, Loading } from '@/components/QueryStatus'
import { formatDate, formatDateTime } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { usePdf } from '@/lib/usePdf'
import { CountTable } from '@/features/teller/components/CountTable'
import { ShiftSummary } from '@/features/teller/components/ShiftSummary'
import { TransactionTable } from '@/features/teller/components/TransactionTable'
import { correctedIds } from '@/features/teller/correctionEligibility'
import { REPORT_STATUS_LABEL, REPORT_STATUS_TONE, reportPrintable } from '@/features/teller/labels'
import { ReviewPanel } from './components/ReviewPanel'
import { useReport } from './queries'
import { DECISION_DONE } from './review'

function decisionMessage(decision: ReviewDecision, result: DailyReport): string {
  if (decision === 'approve') {
    const amount = result.cash_transfer?.amount ?? result.physical_balance ?? 0
    return `Kas ${formatRupiah(amount)} tercatat masuk brankas.`
  }
  if (decision === 'hold') return 'Laporan tetap menunggu. Setujui atau tolak setelah kelengkapannya ada.'
  return 'Shift teller dibuka kembali untuk diperbaiki dan ditutup lagi.'
}

/** Verify one teller's daily report against the slips and the cash, then decide. */
export function ReportReviewPage() {
  const id = Number(useParams().id)
  const query = useReport(id)
  const pdf = usePdf()
  const [decided, setDecided] = useState<{ decision: ReviewDecision; result: DailyReport } | null>(null)
  const doneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (decided) doneRef.current?.focus()
  }, [decided])

  const transactions = query.data?.transactions
  const corrected = useMemo(() => correctedIds(transactions ?? []), [transactions])

  const back = (
    <Link
      to="/supervisor/reports"
      className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900"
    >
      <Icon name="chevronLeft" className="size-3.5" />
      Laporan harian
    </Link>
  )

  if (query.isPending) return <Loading />
  if (query.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Laporan harian" back={back} />
        {query.error.kind === 'notFound' ? (
          <Alert title="Laporan tidak ditemukan">Laporan ini tidak ada.</Alert>
        ) : (
          <LoadError error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    )
  }

  const report = query.data.data
  const rows = query.data.transactions
  const closed = report.status !== 'open' && report.status !== 'rejected'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={back}
        title={`${report.teller?.full_name ?? 'Teller'} · ${formatDate(report.report_date)}`}
        meta={<Badge tone={REPORT_STATUS_TONE[report.status]}>{REPORT_STATUS_LABEL[report.status]}</Badge>}
        description={[
          report.teller?.class,
          report.opened_at && `Dibuka ${formatDateTime(report.opened_at)}`,
          closed && report.submitted_at && `ditutup ${formatDateTime(report.submitted_at)}`,
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          reportPrintable(report.status) && (
            <Button
              variant="secondary"
              icon="printer"
              loading={pdf.pendingKey !== null}
              onClick={() =>
                void pdf.open('report', () => fetchReportPdf(report.id), `laporan-harian-${report.report_date}-${report.id}.pdf`)
              }
            >
              Unduh PDF
            </Button>
          )
        }
      />
      {pdf.error && <Alert>{pdf.error.message}</Alert>}

      {decided && (
        <div ref={doneRef} tabIndex={-1} className="focus-visible:outline-none">
          <Alert
            tone="success"
            title={DECISION_DONE[decided.decision]}
            action={
              <Link to="/supervisor" className={buttonClass('secondary', 'sm')}>
                Kembali ke dasbor
              </Link>
            }
          >
            {decisionMessage(decided.decision, decided.result)}
          </Alert>
        </div>
      )}

      {report.supervisor_note && !decided && (
        <Alert tone={report.status === 'approved' ? 'info' : 'warning'} title="Catatan supervisor">
          “{report.supervisor_note}”
          {report.supervisor && <> — {report.supervisor.full_name}</>}
          {report.reviewed_at && <> · {formatDateTime(report.reviewed_at)}</>}
        </Alert>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <ShiftSummary shift={report} />

          {closed && report.physical_balance !== null && (
            <Panel className="px-4">
              <DataList>
                <DataRow label="Uang fisik (dihitung teller)">{formatRupiah(report.physical_balance)}</DataRow>
                <DataRow label="Selisih">
                  {report.difference === 0 ? 'Rp0 · cocok' : formatRupiah(report.difference ?? 0)}
                </DataRow>
                <DataRow label="Jumlah transaksi">{report.transaction_count}</DataRow>
              </DataList>
            </Panel>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <CountTable title="Hitungan awal" counts={report.opening_counts ?? []} />
            <CountTable
              title={report.status === 'rejected' ? 'Hitungan penutupan (sebelum ditolak)' : 'Hitungan penutupan'}
              counts={report.closing_counts ?? []}
            />
          </div>

          <Section title="Transaksi" description={`${rows.length} transaksi, termasuk koreksi. Cocokkan dengan slip.`}>
            <Panel className="overflow-hidden">
              {rows.length === 0 ? (
                <EmptyState title="Tidak ada transaksi" />
              ) : (
                <TransactionTable rows={rows} corrected={corrected} />
              )}
            </Panel>
          </Section>
        </div>

        <div className="xl:sticky xl:top-6">
          <ReviewPanel key={report.status} report={report} onDecided={(decision, result) => setDecided({ decision, result })} />
        </div>
      </div>
    </div>
  )
}
