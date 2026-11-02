import { Link, useParams } from 'react-router'
import { fetchDailyReportPdf } from '@/api/endpoints/teller'
import type { CashCount } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel, Section } from '@/components/Page'
import { EmptyState, LoadError, Loading } from '@/components/QueryStatus'
import { formatDate, formatDateTime } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { usePdf } from '@/lib/usePdf'
import { ShiftSummary } from './components/ShiftSummary'
import { TransactionTable } from './components/TransactionTable'
import { correctedIds } from './correctionEligibility'
import { REPORT_STATUS_LABEL, REPORT_STATUS_TONE, reportPrintable } from './labels'
import { useDailyReport } from './queries'

function CountTable({ title, counts }: { title: string; counts: CashCount[] }) {
  return (
    <Section title={title}>
      <Panel className="px-4">
        {counts.length === 0 ? (
          <p className="py-4 text-sm text-ink-500">Tidak ada hitungan.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-ink-100">
              {counts.map((c) => (
                <tr key={c.denomination}>
                  <th scope="row" className="py-2 text-left font-normal text-ink-700">
                    {formatRupiah(c.denomination)}
                  </th>
                  <td className="py-2 text-right text-ink-500">× {c.quantity}</td>
                  <td className="py-2 text-right text-ink-900">{formatRupiah(c.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-ink-200 font-semibold">
                <th scope="row" colSpan={2} className="py-2.5 text-left">
                  Total
                </th>
                <td className="py-2.5 text-right">
                  <span className="border-b-[3px] border-double border-ink-300 pb-0.5">
                    {formatRupiah(counts.reduce((sum, c) => sum + c.subtotal, 0))}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </Panel>
    </Section>
  )
}

/** T10: one own shift with counts, transactions and the daily report PDF. */
export function ShiftDetailPage() {
  const id = Number(useParams().id)
  const query = useDailyReport(id)
  const pdf = usePdf()

  const back = (
    <Link
      to="/teller/history"
      className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900"
    >
      <Icon name="chevronLeft" className="size-3.5" />
      Riwayat shift
    </Link>
  )

  if (query.isPending) return <Loading />
  if (query.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Detail shift" back={back} />
        {query.error.kind === 'notFound' ? (
          <Alert title="Laporan tidak ditemukan">Laporan ini tidak ada atau bukan milik Anda.</Alert>
        ) : (
          <LoadError error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    )
  }

  const { data: report, transactions } = query.data
  const active = report.status === 'open' || report.status === 'rejected'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={back}
        title={`Shift ${formatDate(report.report_date)}`}
        meta={<Badge tone={REPORT_STATUS_TONE[report.status]}>{REPORT_STATUS_LABEL[report.status]}</Badge>}
        actions={
          reportPrintable(report.status) && (
            <Button
              icon="printer"
              loading={pdf.pendingKey !== null}
              onClick={() =>
                void pdf.open('report', () => fetchDailyReportPdf(report.id), `laporan-harian-${report.report_date}.pdf`)
              }
            >
              Cetak laporan harian
            </Button>
          )
        }
      />
      {pdf.error && <Alert>{pdf.error.message}</Alert>}

      {report.supervisor_note && (
        <Alert tone={report.status === 'approved' ? 'info' : 'warning'} title="Catatan supervisor">
          “{report.supervisor_note}”
          {report.supervisor && <> — {report.supervisor.full_name}</>}
          {report.reviewed_at && <> · {formatDateTime(report.reviewed_at)}</>}
        </Alert>
      )}

      <ShiftSummary shift={report} />

      {(!active || report.cash_transfer) && (
        <Panel className="max-w-xl px-4">
          <DataList>
            {!active && report.physical_balance !== null && (
              <>
                <DataRow label="Uang fisik">{formatRupiah(report.physical_balance)}</DataRow>
                <DataRow label="Selisih">{formatRupiah(report.difference ?? 0)}</DataRow>
              </>
            )}
            {report.submitted_at && <DataRow label="Ditutup">{formatDateTime(report.submitted_at)}</DataRow>}
            {report.cash_transfer && (
              <DataRow label="Disetor ke brankas">
                {formatRupiah(report.cash_transfer.amount)} · {formatDateTime(report.cash_transfer.transferred_at)}
              </DataRow>
            )}
          </DataList>
        </Panel>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <CountTable title="Hitungan awal" counts={report.opening_counts ?? []} />
        {/* A rejected shift still carries the previous closing count (L3). */}
        <CountTable
          title={report.status === 'rejected' ? 'Hitungan penutupan (ditolak)' : 'Hitungan penutupan'}
          counts={report.closing_counts ?? []}
        />
      </div>

      <Section title="Transaksi" description={`${transactions.length} transaksi, termasuk koreksi.`}>
        <Panel className="overflow-hidden">
          {transactions.length === 0 ? (
            <EmptyState title="Tidak ada transaksi" />
          ) : (
            <TransactionTable rows={transactions} corrected={correctedIds(transactions)} />
          )}
        </Panel>
      </Section>
    </div>
  )
}
