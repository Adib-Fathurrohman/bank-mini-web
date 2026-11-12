import type { ReactNode } from 'react'
import type { Transaction } from '@/api/types'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { DataList, DataRow } from '@/components/DataList'
import { Icon } from '@/components/Icon'
import { formatDateTime, formatTime } from '@/lib/datetime'
import { describeNotes } from '@/lib/denominations'
import { formatRupiah } from '@/lib/money'
import { cashDirection } from '../labels'

/**
 * A recorded transaction as returned by the server (never built from form
 * values), laid out like a receipt: status, the amount, then ruled facts.
 */
export function TransactionReceipt({
  transaction,
  replayed = false,
  title,
  headingRef,
  children,
}: {
  transaction: Transaction
  /** The server returned an earlier, identical submission. */
  replayed?: boolean
  title?: string
  headingRef?: (el: HTMLHeadingElement | null) => void
  /** Actions under the receipt. */
  children?: ReactNode
}) {
  const direction = cashDirection(transaction.type)
  const signed = direction === 'in' ? transaction.amount : -transaction.amount

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-pos-100 text-pos-700">
          <Icon name="check" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-ink-900 focus:outline-none">
            {title ?? `${transaction.type_label} tercatat`}
          </h2>
          <p className="text-[13px] text-ink-500">{formatDateTime(transaction.created_at)}</p>
        </div>
        {replayed && <Badge tone="info">Sudah tercatat sebelumnya</Badge>}
      </div>

      {replayed && (
        <p className="text-[13px] text-ink-600">
          Permintaan ini sudah tercatat sebelumnya; pengiriman ulang tidak membuat transaksi baru.
        </p>
      )}

      <div className="border-y border-ink-200 py-4">
        <Amount value={signed} sign size="xl" tone={direction === 'in' ? 'in' : 'default'} />
        <p className="mt-1 text-[13px] text-ink-500 first-letter:uppercase">{transaction.amount_in_words}</p>
      </div>

      <DataList className="-mt-2">
        <DataRow label="No. transaksi" mono>
          #{transaction.id}
        </DataRow>
        <DataRow label="Nasabah">{transaction.customer.full_name}</DataRow>
        <DataRow label="Rekening" mono>
          {transaction.customer.account_number}
        </DataRow>
        <DataRow label="Saldo sebelum">{formatRupiah(transaction.balance_before)}</DataRow>
        <DataRow label="Saldo sesudah" strong>
          {formatRupiah(transaction.balance_after)}
        </DataRow>
        {describeNotes(transaction.cash) && (
          <DataRow label={direction === 'in' ? 'Uang diterima' : 'Uang dibayarkan'}>{describeNotes(transaction.cash)}</DataRow>
        )}
        {transaction.withdrawal_authorization && (
          <DataRow label="Persetujuan">
            Aplikasi nasabah · {formatTime(transaction.withdrawal_authorization.approved_at)} WIB
          </DataRow>
        )}
        {transaction.corrects_transaction_id !== null && (
          <DataRow label="Membatalkan" mono>
            #{transaction.corrects_transaction_id}
          </DataRow>
        )}
        {transaction.authorized_by && <DataRow label="Otorisasi">{transaction.authorized_by.full_name}</DataRow>}
        {transaction.note && <DataRow label="Alasan">{transaction.note}</DataRow>}
      </DataList>

      {children && <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">{children}</div>}
    </div>
  )
}
