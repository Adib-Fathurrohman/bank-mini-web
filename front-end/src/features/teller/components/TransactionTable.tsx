import type { ReactNode } from 'react'
import type { Transaction } from '@/api/types'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { Icon } from '@/components/Icon'
import { formatTime } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { cashDirection } from '../labels'

function TypeCell({ transaction }: { transaction: Transaction }) {
  const correction = transaction.corrects_transaction_id !== null
  const direction = cashDirection(transaction.type)
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`flex size-6 shrink-0 items-center justify-center rounded ${
          correction ? 'bg-warn-50 text-warn-700' : direction === 'in' ? 'bg-pos-50 text-pos-700' : 'bg-ink-100 text-ink-600'
        }`}
      >
        <Icon name={correction ? 'undo' : direction === 'in' ? 'arrowIn' : 'arrowOut'} className="size-3.5" />
      </span>
      <span className="leading-tight">
        <span className="block text-ink-900">{transaction.type_label}</span>
        <span className="font-mono text-xs text-ink-500">#{transaction.id}</span>
      </span>
    </span>
  )
}

function AmountCell({ transaction, corrected }: { transaction: Transaction; corrected: boolean }) {
  const direction = cashDirection(transaction.type)
  const signed = direction === 'in' ? transaction.amount : -transaction.amount
  return (
    <Amount
      value={signed}
      sign
      size="sm"
      tone={corrected ? 'muted' : direction === 'in' ? 'in' : 'default'}
      className={corrected ? 'line-through decoration-ink-400' : ''}
    />
  )
}

function Note({ transaction, corrected }: { transaction: Transaction; corrected: boolean }) {
  if (transaction.corrects_transaction_id !== null) {
    return (
      <span className="text-[13px] text-ink-600">
        Membatalkan #{transaction.corrects_transaction_id}
        {transaction.authorized_by && <> · {transaction.authorized_by.full_name}</>}
        {transaction.note && <span className="block truncate text-ink-500 italic">“{transaction.note}”</span>}
      </span>
    )
  }
  if (corrected) {
    return <Badge tone="warning">Dikoreksi{transaction.corrected_by ? ` (#${transaction.corrected_by.id})` : ''}</Badge>
  }
  return null
}

/**
 * Transactions as a ruled table on wide screens and a stacked list on phones
 * (no horizontal scrolling). `corrected` lists ids reversed by a correction
 * when the rows lack `corrected_by` (the shift endpoint).
 */
export function TransactionTable({
  rows,
  corrected = new Set(),
  detailed = true,
  actions,
}: {
  rows: Transaction[]
  corrected?: Set<number>
  /** Show the balance and notes columns. */
  detailed?: boolean
  actions?: (transaction: Transaction) => ReactNode
}) {
  const isCorrected = (t: Transaction) => Boolean(t.corrected_by) || corrected.has(t.id)

  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
            <th scope="col" className="w-16 py-2 pr-3 pl-4 font-medium">
              Waktu
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Jenis
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Nasabah
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              Nominal
            </th>
            {detailed && (
              <>
                <th scope="col" className="hidden py-2 pr-3 text-right font-medium xl:table-cell">
                  Saldo akhir
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Keterangan
                </th>
              </>
            )}
            {actions && (
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                <span className="sr-only">Aksi</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((t) => {
            const done = isCorrected(t)
            return (
              <tr key={t.id} className="align-middle hover:bg-ink-50/60">
                <td className="py-2.5 pr-3 pl-4 text-ink-600">{formatTime(t.created_at)}</td>
                <td className="py-2.5 pr-3">
                  <TypeCell transaction={t} />
                </td>
                <td className="max-w-56 py-2.5 pr-3">
                  <span className="block truncate text-ink-900">{t.customer.full_name}</span>
                  <span className="font-mono text-xs text-ink-500">{t.customer.account_number}</span>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <AmountCell transaction={t} corrected={done} />
                </td>
                {detailed && (
                  <>
                    <td className="hidden py-2.5 pr-3 text-right text-ink-600 xl:table-cell">
                      {formatRupiah(t.balance_after)}
                    </td>
                    <td className="max-w-60 py-2.5 pr-3">
                      <Note transaction={t} corrected={done} />
                    </td>
                  </>
                )}
                {actions && (
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-1">{actions(t)}</div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-ink-100 md:hidden">
        {rows.map((t) => {
          const done = isCorrected(t)
          return (
            <li key={t.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <TypeCell transaction={t} />
                <span className="text-right leading-tight">
                  <AmountCell transaction={t} corrected={done} />
                  <span className="block text-xs text-ink-500">{formatTime(t.created_at)}</span>
                </span>
              </div>
              <div className="pl-8.5 text-[13px] text-ink-600">
                {t.customer.full_name} · <span className="font-mono text-xs">{t.customer.account_number}</span>
              </div>
              {detailed && (t.corrects_transaction_id !== null || done) && (
                <div className="pl-8.5">
                  <Note transaction={t} corrected={done} />
                </div>
              )}
              {actions && <div className="flex flex-wrap gap-2 pl-8.5">{actions(t)}</div>}
            </li>
          )
        })}
      </ul>
    </>
  )
}
