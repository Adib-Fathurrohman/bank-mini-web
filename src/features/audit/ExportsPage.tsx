import { useId, useState, type ReactNode } from 'react'
import { fetchAnnualReportPdf, fetchAuditTransactionsPdf, fetchJournalsPdf } from '@/api/endpoints/audit'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { filterControl } from '@/components/Filters'
import { PageHeader, Panel } from '@/components/Page'
import { jakartaToday, schoolYearStart } from '@/lib/datetime'
import { usePdf } from '@/lib/usePdf'

/** A date range for an export; both ends optional. */
function RangeFields({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string
  to: string
  onFrom: (value: string) => void
  onTo: (value: string) => void
}) {
  const fromId = useId()
  const toId = useId()
  const today = jakartaToday()
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={fromId} className="text-xs font-medium text-ink-600">
          Dari tanggal
        </label>
        <input id={fromId} type="date" value={from} max={to || today} onChange={(e) => onFrom(e.target.value)} className={filterControl} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={toId} className="text-xs font-medium text-ink-600">
          Sampai tanggal
        </label>
        <input
          id={toId}
          type="date"
          value={to}
          min={from || undefined}
          max={today}
          onChange={(e) => onTo(e.target.value)}
          className={filterControl}
        />
      </div>
    </div>
  )
}

function ReportCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Panel className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
        <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>
      </div>
      {children}
    </Panel>
  )
}

/** Printable PDF reports: the annual report per school year and the audit trail and journal for a date range. */
export function ExportsPage() {
  const pdf = usePdf()
  const yearId = useId()
  const current = schoolYearStart(jakartaToday())
  const years = Array.from({ length: 5 }, (_, i) => current - i)
  const [year, setYear] = useState(current)
  const [auditRange, setAuditRange] = useState({ from: '', to: '' })
  const [journalRange, setJournalRange] = useState({ from: '', to: '' })

  const busy = (key: string) => pdf.pendingKey === key
  const range = (r: { from: string; to: string }) => ({ from: r.from || undefined, to: r.to || undefined })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Laporan" description="Laporan dalam bentuk PDF untuk dicetak atau diarsipkan." />
      {pdf.error && <Alert>{pdf.error.message}</Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <ReportCard
          title="Laporan tahunan"
          description="Satu tahun ajaran (Juli–Juni): saldo awal, setoran, penarikan, dan saldo akhir per rekening."
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={yearId} className="text-xs font-medium text-ink-600">
              Tahun ajaran
            </label>
            <select id={yearId} value={year} onChange={(e) => setYear(Number(e.target.value))} className={filterControl}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}/{y + 1}
                  {y === current ? ' (berjalan)' : ''}
                </option>
              ))}
            </select>
          </div>
          <Button
            icon="printer"
            loading={busy('annual')}
            disabled={pdf.pendingKey !== null}
            onClick={() => void pdf.open('annual', () => fetchAnnualReportPdf(year), `laporan-tahunan-${year}-${year + 1}.pdf`)}
          >
            Unduh laporan tahunan
          </Button>
        </ReportCard>

        <ReportCard
          title="Jejak audit transaksi"
          description="Semua transaksi dengan saldo sebelum dan sesudah serta rujukan koreksi. Kosongkan tanggal untuk semuanya."
        >
          <RangeFields
            from={auditRange.from}
            to={auditRange.to}
            onFrom={(from) => setAuditRange((r) => ({ ...r, from }))}
            onTo={(to) => setAuditRange((r) => ({ ...r, to }))}
          />
          <Button
            variant="secondary"
            icon="printer"
            loading={busy('audit')}
            disabled={pdf.pendingKey !== null}
            onClick={() => void pdf.open('audit', () => fetchAuditTransactionsPdf(range(auditRange)), 'jejak-audit-transaksi.pdf')}
          >
            Unduh jejak audit
          </Button>
        </ReportCard>

        <ReportCard
          title="Jurnal akuntansi"
          description="Total per akun, cek keseimbangan, dan setiap baris jurnal. Kosongkan tanggal untuk semuanya."
        >
          <RangeFields
            from={journalRange.from}
            to={journalRange.to}
            onFrom={(from) => setJournalRange((r) => ({ ...r, from }))}
            onTo={(to) => setJournalRange((r) => ({ ...r, to }))}
          />
          <Button
            variant="secondary"
            icon="printer"
            loading={busy('journal')}
            disabled={pdf.pendingKey !== null}
            onClick={() => void pdf.open('journal', () => fetchJournalsPdf(range(journalRange)), 'jurnal-akuntansi.pdf')}
          >
            Unduh jurnal
          </Button>
        </ReportCard>
      </div>
      <p className="text-[13px] text-ink-500">
        Daftar yang sangat panjang dicetak sampai 5.000 baris; PDF menyebutkan bila terpotong. Mutasi per nasabah ada di
        halaman detail nasabah.
      </p>
    </div>
  )
}
