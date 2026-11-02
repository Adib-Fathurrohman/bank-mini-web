import { useId, useState } from 'react'
import { Link, useParams } from 'react-router'
import { fetchStatementPdf } from '@/api/endpoints/directory'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { filterControl } from '@/components/Filters'
import { Icon } from '@/components/Icon'
import { Eyebrow, PageHeader, Panel, Section } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, Loading, SkeletonRows } from '@/components/QueryStatus'
import { formatDateTime, jakartaToday } from '@/lib/datetime'
import { usePdf } from '@/lib/usePdf'
import { AuditTable } from '@/features/audit/components/AuditTable'
import { useAuditTransactions } from '@/features/audit/queries'
import { ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_TONE, ACTIVATION_LABEL, ACTIVATION_TONE, classLabel } from './labels'
import { useCustomer } from './queries'

/** Kartu simpanan PDF for a date range (both optional). */
function StatementForm({ customerId, accountNumber }: { customerId: number; accountNumber: string }) {
  const fromId = useId()
  const toId = useId()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const pdf = usePdf()
  const today = jakartaToday()

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={fromId} className="text-xs font-medium text-ink-600">
            Dari tanggal
          </label>
          <input id={fromId} type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} className={filterControl} />
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
            onChange={(e) => setTo(e.target.value)}
            className={filterControl}
          />
        </div>
      </div>
      <Button
        variant="secondary"
        icon="printer"
        loading={pdf.pendingKey !== null}
        onClick={() =>
          void pdf.open(
            'statement',
            () => fetchStatementPdf(customerId, { from: from || undefined, to: to || undefined }),
            `mutasi-${accountNumber}.pdf`,
          )
        }
      >
        Unduh mutasi PDF
      </Button>
      {pdf.error && <Alert>{pdf.error.message}</Alert>}
    </div>
  )
}

/** One account (closed ones too): data, app activation, balance, statement PDF and its transactions. */
export function CustomerDetailPage() {
  const id = Number(useParams().id)
  const query = useCustomer(id)
  const [page, setPage] = useState(1)
  const history = useAuditTransactions({ customer_id: id }, page)

  const back = (
    <Link to="/customers" className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900">
      <Icon name="chevronLeft" className="size-3.5" />
      Nasabah
    </Link>
  )

  if (query.isPending) return <Loading />
  if (query.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Nasabah" back={back} />
        {query.error.kind === 'notFound' ? (
          <Alert title="Nasabah tidak ditemukan" />
        ) : (
          <LoadError error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    )
  }

  const c = query.data
  const closed = c.deleted_at !== null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={back}
        title={c.full_name}
        meta={
          <>
            <Badge tone={ACCOUNT_STATUS_TONE[c.account_status]}>{ACCOUNT_STATUS_LABEL[c.account_status]}</Badge>
            {!closed && <Badge tone={ACTIVATION_TONE[c.activation_status]}>{ACTIVATION_LABEL[c.activation_status]}</Badge>}
          </>
        }
        description={
          <span className="font-mono text-[13px]">
            {c.account_number} · NIS {c.nis}
          </span>
        }
      />

      {closed && (
        <Alert tone="info" title="Rekening ditutup">
          Ditutup {formatDateTime(c.deleted_at!)}. Data dan riwayat tetap dapat dilihat; rekening tidak dapat bertransaksi.
        </Alert>
      )}
      {c.account_status === 'suspended' && (
        <Alert tone="warning" title="Rekening ditangguhkan">
          Nasabah hanya dapat melihat saldo; setor dan tarik di loket ditolak.
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="px-4">
          <DataList>
            <DataRow label="Nama">{c.full_name}</DataRow>
            <DataRow label="NIS" mono>
              {c.nis}
            </DataRow>
            <DataRow label="No. rekening" mono>
              {c.account_number}
            </DataRow>
            <DataRow label="Kelas">{classLabel(c)}</DataRow>
            <DataRow label="Jurusan">{c.major.major_name}</DataRow>
            <DataRow label="Email">{c.email ?? <span className="text-ink-500">Belum ada</span>}</DataRow>
            <DataRow label="Aplikasi">
              {c.activated_at ? `Aktif sejak ${formatDateTime(c.activated_at)}` : 'Belum diaktivasi'}
            </DataRow>
            <DataRow label="Dibuka">{formatDateTime(c.created_at)}</DataRow>
          </DataList>
        </Panel>

        <Panel className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <Eyebrow>Saldo</Eyebrow>
            <Amount value={c.balance} size="xl" />
          </div>
          <StatementForm customerId={c.id} accountNumber={c.account_number} />
        </Panel>
      </div>

      <Section
        title="Transaksi"
        description="Terbaru di atas, termasuk koreksi."
        actions={
          <Link
            to={`/audit/transactions?customer_id=${c.id}`}
            className="text-[13px] font-medium text-brand-700 hover:underline"
          >
            Buka di log audit
          </Link>
        }
      >
        <Panel className="overflow-hidden">
          {history.isPending ? (
            <SkeletonRows rows={3} />
          ) : history.error ? (
            <div className="p-4">
              <LoadError error={history.error} onRetry={() => void history.refetch()} />
            </div>
          ) : history.data.data.length === 0 ? (
            <EmptyState title="Belum ada transaksi" />
          ) : (
            <AuditTable rows={history.data.data} showCustomer={false} />
          )}
        </Panel>
      </Section>
      {history.data && <Pagination meta={history.data.meta} onPage={setPage} />}
    </div>
  )
}
