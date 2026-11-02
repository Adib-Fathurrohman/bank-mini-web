import { Link } from 'react-router'
import type { Transaction } from '@/api/types'
import { Icon } from '@/components/Icon'
import { formatShortDate, formatTime, jakartaDate } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { AmountCell, TransactionNote, TypeCell } from '@/features/teller/components/TransactionTable'

function When({ iso }: { iso: string }) {
  return (
    <span className="leading-tight">
      <span className="block text-ink-900">{formatShortDate(jakartaDate(iso))}</span>
      <span className="text-xs text-ink-500">{formatTime(iso)} WIB</span>
    </span>
  )
}

/**
 * The audit trail: every teller's transactions with date, teller and customer.
 * `showCustomer={false}` on a customer's own page. Rows open the detail.
 */
export function AuditTable({ rows, showCustomer = true }: { rows: Transaction[]; showCustomer?: boolean }) {
  const corrected = (t: Transaction) => Boolean(t.corrected_by)
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
            <th scope="col" className="w-28 py-2 pr-3 pl-4 font-medium">
              Waktu
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Jenis
            </th>
            {showCustomer && (
              <th scope="col" className="py-2 pr-3 font-medium">
                Nasabah
              </th>
            )}
            <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
              Teller
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              Nominal
            </th>
            <th scope="col" className="hidden py-2 pr-3 text-right font-medium xl:table-cell">
              Saldo akhir
            </th>
            <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
              Keterangan
            </th>
            <th scope="col" className="py-2 pr-4">
              <span className="sr-only">Detail</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((t) => (
            <tr key={t.id} className="align-middle hover:bg-ink-50/60">
              <td className="py-2.5 pr-3 pl-4 whitespace-nowrap">
                <When iso={t.created_at} />
              </td>
              <td className="py-2.5 pr-3">
                <TypeCell transaction={t} />
              </td>
              {showCustomer && (
                <td className="max-w-52 py-2.5 pr-3">
                  <span className="block truncate text-ink-900">{t.customer.full_name}</span>
                  <span className="font-mono text-xs text-ink-500">{t.customer.account_number}</span>
                </td>
              )}
              <td className="hidden max-w-40 truncate py-2.5 pr-3 text-ink-700 lg:table-cell">{t.teller?.full_name ?? '—'}</td>
              <td className="py-2.5 pr-3 text-right">
                <AmountCell transaction={t} corrected={corrected(t)} />
              </td>
              <td className="hidden py-2.5 pr-3 text-right text-ink-600 xl:table-cell">{formatRupiah(t.balance_after)}</td>
              <td className="hidden max-w-56 py-2.5 pr-3 lg:table-cell">
                <TransactionNote transaction={t} corrected={corrected(t)} />
              </td>
              <td className="py-2 pr-4 text-right">
                <Link
                  to={`/audit/transactions/${t.id}`}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline"
                >
                  Detail
                  <Icon name="chevronRight" className="size-3.5" />
                  <span className="sr-only">transaksi #{t.id}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-ink-100 md:hidden">
        {rows.map((t) => (
          <li key={t.id}>
            <Link to={`/audit/transactions/${t.id}`} className="flex flex-col gap-1.5 px-4 py-3 hover:bg-ink-50">
              <span className="flex items-start justify-between gap-3">
                <TypeCell transaction={t} />
                <span className="text-right leading-tight">
                  <AmountCell transaction={t} corrected={corrected(t)} />
                  <span className="block text-xs text-ink-500">
                    {formatShortDate(jakartaDate(t.created_at))} {formatTime(t.created_at)}
                  </span>
                </span>
              </span>
              <span className="pl-8.5 text-[13px] text-ink-600">
                {showCustomer && <>{t.customer.full_name} · </>}
                {t.teller?.full_name ?? '—'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
