import { useMemo } from 'react'
import { fetchAuditTransactionsPdf, type AuditFilters } from '@/api/endpoints/audit'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { FilterBar, FilterField, filterControl, SearchFilter } from '@/components/Filters'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { jakartaToday } from '@/lib/datetime'
import { usePdf } from '@/lib/usePdf'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { AuditTable } from './components/AuditTable'
import { parseOption, TRANSACTION_TYPE_LABEL, TRANSACTION_TYPES } from './labels'
import { useAuditTransactions } from './queries'

type Key = 'from' | 'to' | 'teller' | 'customer' | 'type' | 'teller_id' | 'customer_id'

/** The transaction log of every teller (newest first), filtered by date, teller, customer and type; PDF export. */
export function AuditLogPage() {
  const { get, update, clear, page, setPage, filtered } = useUrlFilters<Key>()
  const pdf = usePdf()
  const today = jakartaToday()

  const from = get('from')
  const to = get('to')
  const teller = get('teller')
  const customer = get('customer')
  const type = parseOption(TRANSACTION_TYPES, get('type'))
  const tellerId = get('teller_id')
  const customerId = get('customer_id')

  const filters = useMemo<AuditFilters>(
    () => ({
      from: from || undefined,
      to: to || undefined,
      teller: teller || undefined,
      customer: customer || undefined,
      type,
      teller_id: tellerId ? Number(tellerId) : undefined,
      customer_id: customerId ? Number(customerId) : undefined,
    }),
    [from, to, teller, customer, type, tellerId, customerId],
  )
  const list = useAuditTransactions(filters, page)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Log audit"
        description="Semua transaksi dari semua teller, terbaru di atas. Koreksi tercatat sebagai transaksi tersendiri."
        actions={
          <Button
            variant="secondary"
            icon="printer"
            loading={pdf.pendingKey !== null}
            onClick={() => void pdf.open('audit', () => fetchAuditTransactionsPdf(filters), 'jejak-audit-transaksi.pdf')}
          >
            Ekspor PDF
          </Button>
        }
      />
      {pdf.error && <Alert>{pdf.error.message}</Alert>}

      <Panel className="overflow-hidden">
        <FilterBar>
          <FilterField id="audit-from" label="Dari tanggal">
            <input
              id="audit-from"
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => update({ from: e.target.value })}
              className={filterControl}
            />
          </FilterField>
          <FilterField id="audit-to" label="Sampai tanggal">
            <input
              id="audit-to"
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => update({ to: e.target.value })}
              className={filterControl}
            />
          </FilterField>
          <FilterField id="audit-teller" label="Teller">
            <SearchFilter
              id="audit-teller"
              value={teller}
              placeholder="Nama atau username"
              onChange={(value) => update({ teller: value, teller_id: '' })}
            />
          </FilterField>
          <FilterField id="audit-customer" label="Nasabah" wide>
            <SearchFilter
              id="audit-customer"
              value={customer}
              placeholder="Nama, NIS, atau no. rekening"
              onChange={(value) => update({ customer: value, customer_id: '' })}
            />
          </FilterField>
          <FilterField id="audit-type" label="Jenis">
            <select id="audit-type" value={type ?? ''} onChange={(e) => update({ type: e.target.value })} className={filterControl}>
              <option value="">Semua jenis</option>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TRANSACTION_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </FilterField>
          {filtered && (
            <Button variant="ghost" onClick={clear}>
              Hapus filter
            </Button>
          )}
        </FilterBar>
        {(tellerId || customerId) && (
          <p className="border-b border-ink-200 bg-brand-50 px-4 py-2 text-[13px] text-brand-900">
            Disaring untuk {tellerId ? 'satu teller' : 'satu nasabah'} dari halaman detail.{' '}
            <button
              type="button"
              className="font-medium underline underline-offset-2"
              onClick={() => update({ teller_id: '', customer_id: '' })}
            >
              Tampilkan semua
            </button>
          </p>
        )}

        {list.isPending ? (
          <SkeletonRows />
        ) : list.error ? (
          <div className="p-4">
            <LoadError error={list.error} onRetry={() => void list.refetch()} />
          </div>
        ) : list.data.data.length === 0 ? (
          <EmptyState title={filtered ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}>
            {filtered ? 'Ubah atau hapus filter.' : 'Transaksi muncul di sini begitu teller mencatatnya.'}
          </EmptyState>
        ) : (
          <AuditTable rows={list.data.data} />
        )}
      </Panel>

      {list.data && <Pagination meta={list.data.meta} onPage={setPage} />}
    </div>
  )
}
