import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { deposit, type RecordedTransaction } from '@/api/endpoints/teller'
import type { ApiError } from '@/api/errors'
import type { CustomerSummary } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Button } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { DialogActions } from '@/components/Dialog'
import { Icon } from '@/components/Icon'
import { matchesAmount, toNotesPayload, type DenominationCounts } from '@/lib/denominations'
import { newIdempotencyKey } from '@/lib/idempotency'
import { formatRupiah } from '@/lib/money'
import { terbilangRupiah } from '@/lib/terbilang'
import type { WithdrawalFlow } from '../withdrawalAuthorization'
import { NotesGrid } from './NotesGrid'

export type CounterTransactionType = 'deposit' | 'withdrawal'

/** What the teller and the customer check before anything is sent: one amount, then the facts. */
function ReviewSummary({
  type,
  customer,
  amount,
}: {
  type: CounterTransactionType
  customer: CustomerSummary
  amount: number
}) {
  const after = type === 'deposit' ? customer.balance + amount : customer.balance - amount
  return (
    <>
      <div className="rounded-lg bg-ink-50 px-4 py-4 text-center">
        <p className="text-[13px] text-ink-500">{type === 'deposit' ? 'Setor tunai' : 'Tarik tunai'}</p>
        <Amount value={type === 'deposit' ? amount : -amount} sign size="xl" tone={type === 'deposit' ? 'in' : 'default'} />
        <p className="mt-1 text-[13px] text-ink-600 first-letter:uppercase">{terbilangRupiah(amount)}</p>
      </div>
      <DataList>
        <DataRow label="Nasabah">{customer.full_name}</DataRow>
        <DataRow label="Rekening" mono>
          {customer.account_number}
        </DataRow>
        <DataRow label="Saldo sekarang">{formatRupiah(customer.balance)}</DataRow>
        <DataRow label="Saldo sesudah" strong>
          {formatRupiah(after)}
        </DataRow>
      </DataList>
    </>
  )
}

/**
 * T4 deposit: review → submit → hand the recorded transaction back. Mounted
 * once per confirmation, so each gets its own Idempotency-Key, reused for every
 * retry of that submission. In a shift that tracks the drawer per denomination
 * (`tracked`), the teller also enters the notes received ("Uang diterima"); they
 * must add up to the amount, because no change is given.
 */
export function DepositReview({
  customer,
  amount,
  tracked = false,
  onPendingChange,
  onRecorded,
  onCancel,
}: {
  customer: CustomerSummary
  amount: number
  /** The shift tracks the drawer per denomination: ask for the notes received. */
  tracked?: boolean
  onPendingChange: (pending: boolean) => void
  onRecorded: (result: RecordedTransaction) => void
  onCancel: () => void
}) {
  const [idempotencyKey] = useState(newIdempotencyKey)
  const [notes, setNotes] = useState<DenominationCounts>({})
  const mutation = useMutation<RecordedTransaction, ApiError>({
    mutationFn: () =>
      deposit(
        { account_number: customer.account_number, amount, ...(tracked ? { denominations: toNotesPayload(notes) } : {}) },
        idempotencyKey,
      ),
    onMutate: () => onPendingChange(true),
    onSettled: () => onPendingChange(false),
    onSuccess: onRecorded,
  })

  const error = mutation.error
  const pending = mutation.isPending
  const notesReady = !tracked || matchesAmount(amount, notes)
  // After a lost response the same submission must be repeated unchanged (same key, same notes).
  const locked = pending || error?.kind === 'network'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!pending && notesReady) mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ReviewSummary type="deposit" customer={customer} amount={amount} />

      {tracked && (
        <NotesGrid
          label="Uang diterima"
          amount={amount}
          counts={notes}
          onChange={(next) => {
            setNotes(next)
            // A refusal was about the previous notes.
            if (mutation.isError && error?.kind !== 'network') mutation.reset()
          }}
          disabled={locked}
        />
      )}

      {error?.kind === 'network' ? (
        <Alert tone="warning" title="Status setoran belum diketahui">
          Koneksi terputus sebelum server menjawab. Kirim ulang dengan tombol di bawah: setoran yang sama tidak akan
          tercatat dua kali.
        </Alert>
      ) : (
        error && (
          <Alert title="Setoran tidak dicatat">
            {error.field('amount') ?? error.field('account_number') ?? error.fieldUnder('denominations') ?? error.message}
          </Alert>
        )
      )}

      <DialogActions>
        <Button variant="secondary" disabled={pending} onClick={onCancel}>
          Ubah
        </Button>
        <Button type="submit" loading={pending} disabled={!notesReady} data-autofocus={!tracked || undefined}>
          {error?.kind === 'network' ? 'Kirim ulang' : `Setor ${formatRupiah(amount)}`}
        </Button>
      </DialogActions>
    </form>
  )
}

/** Refusals that mean the lookup is out of date: the app was not activated or the PIN was removed meanwhile. */
const CUSTOMER_STATE_CODES = ['customer_app_not_activated', 'pin_not_set']

/**
 * T4 withdrawal, Mode A: review, then send the request to the customer's app.
 * There is no PIN field: the customer approves on their own phone.
 */
export function WithdrawalRequestReview({
  customer,
  amount,
  flow,
  onCustomerChanged,
  onCancel,
}: {
  customer: CustomerSummary
  amount: number
  flow: WithdrawalFlow
  /** The server refused because of the customer's PIN or app state: refresh the customer panel. */
  onCustomerChanged: () => void
  onCancel: () => void
}) {
  const { create } = flow
  const error = create.error
  const pending = create.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    create.mutate(
      { account_number: customer.account_number, amount },
      { onError: (e) => (e.kind === 'pin' || CUSTOMER_STATE_CODES.includes(e.code ?? '')) && onCustomerChanged() },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ReviewSummary type="withdrawal" customer={customer} amount={amount} />

      <div className="flex gap-3 rounded-lg border border-ink-200 px-3.5 py-3 text-[13px] text-ink-700">
        <Icon name="phone" className="mt-0.5 size-4 text-brand-700" />
        <p>
          Permintaan dikirim ke aplikasi Bank Mini milik nasabah. Nasabah menyetujui dengan PIN di ponselnya sendiri;
          teller tidak memasukkan atau melihat PIN. Waktu persetujuan 2 menit.
        </p>
      </div>

      {error?.kind === 'network' ? (
        <Alert tone="warning" title="Status permintaan belum diketahui">
          Koneksi terputus sebelum server menjawab. Coba lagi; jika permintaan ternyata sudah terkirim, layar ini akan
          melanjutkannya.
        </Alert>
      ) : (
        error && <Alert title="Permintaan tidak dikirim">{error.field('amount') ?? error.message}</Alert>
      )}

      <DialogActions>
        <Button variant="secondary" disabled={pending} onClick={onCancel}>
          Ubah
        </Button>
        <Button type="submit" icon="phone" loading={pending} data-autofocus>
          {error?.kind === 'network' ? 'Coba lagi' : 'Kirim ke aplikasi nasabah'}
        </Button>
      </DialogActions>
    </form>
  )
}
