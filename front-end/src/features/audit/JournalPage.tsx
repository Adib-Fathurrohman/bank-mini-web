import { useMemo } from 'react'
import { Link } from 'react-router'
import { fetchJournalsPdf, type JournalFilters } from '@/api/endpoints/audit'
import type { AccountCode, JournalPosition, TrialBalance } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { FilterBar, FilterField, filterControl } from '@/components/Filters'
import { PageHeader, Panel, Section } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, Skeleton, SkeletonRows } from '@/components/QueryStatus'
import { formatShortDate, formatTime, jakartaDate, jakartaToday } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { usePdf } from '@/lib/usePdf'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { ACCOUNT_LABEL, parseOption, POSITION_LABEL } from './labels'
import { useJournals, useTrialBalance } from './queries'

const ACCOUNTS = Object.keys(ACCOUNT_LABEL) as AccountCode[]
const POSITIONS = Object.keys(POSITION_LABEL) as JournalPosition[]

/** Trial balance: per account debit and credit totals; double entry keeps both sides equal. */
function TrialBalanceTable({ data }: { data: TrialBalance }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
          <th scope="col" className="py-2 pr-3 pl-4 font-medium">
            Akun
          </th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">
            Debit
          </th>
          <th scope="col" className="py-2 pr-4 text-right font-medium">
            Kredit
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-100">
        {data.accounts.length === 0 ? (
          <tr>
            <td colSpan={3} className="px-4 py-4 text-ink-500">
              Tidak ada jurnal pada rentang ini.
            </td>
          </tr>
        ) : (
          data.accounts.map((a) => (
            <tr key={a.account_code}>
              <td className="py-2.5 pr-3 pl-4 text-ink-900">
                {a.account_code} · {a.account_name}
              </td>
              <td className="py-2.5 pr-3 text-right">{formatRupiah(a.total_debit)}</td>
              <td className="py-2.5 pr-4 text-right">{formatRupiah(a.total_credit)}</td>
            </tr>
          ))
        )}
      </tbody>
      <tfoot>
        <tr className="border-t border-ink-200 font-semibold">
          <th scope="row" className="py-2.5 pr-3 pl-4 text-left">
            Total
          </th>
          <td className="py-2.5 pr-3 text-right">
            <span className="border-b-[3px] border-double border-ink-300 pb-0.5">{formatRupiah(data.total_debit)}</span>
          </td>
          <td className="py-2.5 pr-4 text-right">
            <span className="border-b-[3px] border-double border-ink-300 pb-0.5">{formatRupiah(data.total_credit)}</span>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}

/** The accounting journal (every debit and credit line) and the trial balance for the same dates; PDF export. */
export function JournalPage() {
  const { get, update, clear, page, setPage, filtered } = useUrlFilters<'from' | 'to' | 'account' | 'position'>()
  const pdf = usePdf()
  const today = jakartaToday()
  const from = get('from')
  const to = get('to')
  const account = parseOption(ACCOUNTS, get('account'))
  const position = parseOption(POSITIONS, get('position'))

  const range = useMemo<JournalFilters>(() => ({ from: from || undefined, to: to || undefined }), [from, to])
  const filters = useMemo<JournalFilters>(() => ({ ...range, account_code: account, position }), [range, account, position])
  const trial = useTrialBalance(range)
  const journals = useJournals(filters, page)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jurnal & neraca saldo"
        description="Setiap transaksi dicatat dua kali: satu debit dan satu kredit dengan jumlah yang sama."
        actions={
          <Button
            variant="secondary"
            icon="printer"
            loading={pdf.pendingKey !== null}
            onClick={() => void pdf.open('journal', () => fetchJournalsPdf(filters), 'jurnal-akuntansi.pdf')}
          >
            Ekspor PDF
          </Button>
        }
      />
      {pdf.error && <Alert>{pdf.error.message}</Alert>}

      <Panel className="overflow-hidden">
        <FilterBar>
          <FilterField id="journal-from" label="Dari tanggal">
            <input
              id="journal-from"
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => update({ from: e.target.value })}
              className={filterControl}
            />
          </FilterField>
          <FilterField id="journal-to" label="Sampai tanggal">
            <input
              id="journal-to"
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => update({ to: e.target.value })}
              className={filterControl}
            />
          </FilterField>
          {filtered && (
            <Button variant="ghost" onClick={clear}>
              Hapus filter
            </Button>
          )}
        </FilterBar>
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <h2 className="text-[15px] font-semibold text-ink-900">Neraca saldo</h2>
          {trial.data && (
            <Badge tone={trial.data.is_balanced ? 'success' : 'danger'}>
              {trial.data.is_balanced ? 'Seimbang' : 'Tidak seimbang'}
            </Badge>
          )}
        </div>
        <div className="pt-2">
          {trial.isPending ? (
            <div className="flex flex-col gap-2 px-4 pb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : trial.error ? (
            <div className="px-4 pb-4">
              <LoadError error={trial.error} onRetry={() => void trial.refetch()} />
            </div>
          ) : (
            <TrialBalanceTable data={trial.data} />
          )}
        </div>
      </Panel>

      <Section
        title="Baris jurnal"
        description="Terbaru di atas."
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <FilterField id="journal-account" label="Akun">
              <select
                id="journal-account"
                value={account ?? ''}
                onChange={(e) => update({ account: e.target.value })}
                className={filterControl}
              >
                <option value="">Semua akun</option>
                {ACCOUNTS.map((a) => (
                  <option key={a} value={a}>
                    {ACCOUNT_LABEL[a]}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField id="journal-position" label="Posisi">
              <select
                id="journal-position"
                value={position ?? ''}
                onChange={(e) => update({ position: e.target.value })}
                className={filterControl}
              >
                <option value="">Debit dan kredit</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {POSITION_LABEL[p]}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>
        }
      >
        <Panel className="overflow-hidden">
          {journals.isPending ? (
            <SkeletonRows />
          ) : journals.error ? (
            <div className="p-4">
              <LoadError error={journals.error} onRetry={() => void journals.refetch()} />
            </div>
          ) : journals.data.data.length === 0 ? (
            <EmptyState title="Tidak ada baris jurnal" />
          ) : (
            <>
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                    <th scope="col" className="w-28 py-2 pr-3 pl-4 font-medium">
                      Waktu
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Transaksi
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Akun
                    </th>
                    <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
                      Nasabah · teller
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">
                      Debit
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">
                      Kredit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {journals.data.data.map((l) => (
                    <tr key={l.id} className="hover:bg-ink-50/60">
                      <td className="py-2.5 pr-3 pl-4 whitespace-nowrap">
                        <span className="block text-ink-900">{formatShortDate(jakartaDate(l.created_at))}</span>
                        <span className="text-xs text-ink-500">{formatTime(l.created_at)} WIB</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Link to={`/audit/transactions/${l.transaction_id}`} className="font-mono text-[13px] font-medium text-brand-700 hover:underline">
                          #{l.transaction_id}
                        </Link>
                      </td>
                      <td className={`py-2.5 pr-3 text-ink-900 ${l.position === 'credit' ? 'pl-4' : ''}`}>
                        {l.account_code} · {l.account_name}
                      </td>
                      <td className="hidden max-w-64 py-2.5 pr-3 lg:table-cell">
                        {l.transaction && (
                          <span className="block truncate text-ink-700">
                            {l.transaction.customer.full_name} · {l.transaction.teller.full_name}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right">{l.position === 'debit' ? formatRupiah(l.amount) : ''}</td>
                      <td className="py-2.5 pr-4 text-right">{l.position === 'credit' ? formatRupiah(l.amount) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-ink-100 md:hidden">
                {journals.data.data.map((l) => (
                  <li key={l.id}>
                    <Link to={`/audit/transactions/${l.transaction_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink-900">
                          {l.account_code} · {l.account_name}
                        </span>
                        <span className="text-xs text-ink-500">
                          #{l.transaction_id} · {formatShortDate(jakartaDate(l.created_at))} {formatTime(l.created_at)}
                        </span>
                      </span>
                      <span className="text-right text-sm">
                        <span className="block font-medium text-ink-900">{formatRupiah(l.amount)}</span>
                        <span className="text-xs text-ink-500">{POSITION_LABEL[l.position]}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </Section>

      {journals.data && <Pagination meta={journals.data.meta} onPage={setPage} />}
    </div>
  )
}
