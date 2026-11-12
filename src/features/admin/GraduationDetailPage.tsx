import { Link, useLocation, useParams } from 'react-router'
import { fetchGraduationSlip, fetchGraduationSlips } from '@/api/endpoints/graduation'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { LoadError, Loading } from '@/components/QueryStatus'
import { formatDateTime } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { usePdf } from '@/lib/usePdf'
import { useGraduation } from './queries'

/** One graduation run: totals, who was paid what, and the payment slips (print all or one). Admin and supervisor. */
export function GraduationDetailPage() {
  const { id = '' } = useParams()
  const justRan = Boolean((useLocation().state as { justRan?: boolean } | null)?.justRan)
  const query = useGraduation(id)
  const pdf = usePdf()

  const back = (
    <Link
      to="/graduations"
      className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900"
    >
      <Icon name="chevronLeft" className="size-3.5" />
      Riwayat kelulusan
    </Link>
  )

  if (query.isPending) return <Loading />
  if (query.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Kelulusan" back={back} />
        {query.error.kind === 'notFound' ? (
          <Alert title="Kelulusan tidak ditemukan" />
        ) : (
          <LoadError error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    )
  }

  const g = query.data
  const customers = g.customers ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={back}
        title={`Kelulusan ${g.label}`}
        description={`${formatDateTime(g.created_at)}${g.executed_by ? ` · dijalankan ${g.executed_by.full_name}` : ''}`}
        actions={
          g.paid_count > 0 && (
            <Button
              icon="printer"
              loading={pdf.pendingKey === 'all'}
              disabled={pdf.pendingKey !== null && pdf.pendingKey !== 'all'}
              onClick={() => void pdf.open('all', () => fetchGraduationSlips(g.id), `bukti-kelulusan-${g.label}.pdf`)}
            >
              Cetak semua bukti
            </Button>
          )
        }
      />

      {justRan && (
        <Alert tone="success" title={`${g.customer_count} rekening ditutup, ${formatRupiah(g.total_amount)} dibayarkan`}>
          Cetak bukti pembayaran, minta siswa menandatangani, lalu serahkan uangnya dari brankas. Bukti dapat dicetak ulang
          kapan saja dari halaman ini.
        </Alert>
      )}
      {pdf.error && <Alert>{pdf.error.message}</Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                  Nama
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">
                  NIS
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">
                  Kelas
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Dibayarkan
                </th>
                <th scope="col" className="py-2 pr-4">
                  <span className="sr-only">Cetak</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="max-w-60 py-2.5 pr-3 pl-4">
                    <Link to={`/customers/${c.id}`} className="block truncate text-ink-900 hover:underline">
                      {c.full_name}
                    </Link>
                    <span className="font-mono text-xs text-ink-500">{c.account_number}</span>
                  </td>
                  <td className="hidden py-2.5 pr-3 font-mono text-[13px] text-ink-700 sm:table-cell">{c.nis}</td>
                  <td className="hidden py-2.5 pr-3 text-ink-700 md:table-cell">
                    {c.class} {c.major_code} {c.group}
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    {c.amount > 0 ? <Amount value={c.amount} size="sm" /> : <Badge tone="neutral">Hanya ditutup</Badge>}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {c.amount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="printer"
                        loading={pdf.pendingKey === `c${c.id}`}
                        disabled={pdf.pendingKey !== null && pdf.pendingKey !== `c${c.id}`}
                        onClick={() =>
                          void pdf.open(`c${c.id}`, () => fetchGraduationSlip(g.id, c.id), `bukti-kelulusan-${c.nis}.pdf`)
                        }
                      >
                        Cetak
                        <span className="sr-only"> bukti {c.full_name}</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel className="px-4">
          <DataList>
            <DataRow label="Kelas">{g.label}</DataRow>
            <DataRow label="Rekening ditutup">{g.customer_count}</DataRow>
            <DataRow label="Menerima uang">{g.paid_count}</DataRow>
            <DataRow label="Total dibayarkan" strong>
              {formatRupiah(g.total_amount)}
            </DataRow>
            <DataRow label="Terbilang">
              <span className="first-letter:uppercase">{g.total_amount_in_words}</span>
            </DataRow>
            {g.note && <DataRow label="Catatan">{g.note}</DataRow>}
          </DataList>
          <p className="pb-3 text-[13px] text-ink-500">
            Uang dibayarkan dari brankas, bukan dari laci teller, dan tidak masuk laporan shift.
          </p>
        </Panel>
      </div>
    </div>
  )
}
