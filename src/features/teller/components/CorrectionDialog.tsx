import { useId, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { correctTransaction, fetchReceiptPdf, type RecordedTransaction } from '@/api/endpoints/teller'
import type { ApiError } from '@/api/errors'
import type { Transaction } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Button } from '@/components/Button'
import { DialogActions } from '@/components/Dialog'
import { Icon } from '@/components/Icon'
import { controlClass, describedBy, FieldLabel, FieldMessage, TextField } from '@/components/TextField'
import { formatDateTime } from '@/lib/datetime'
import { newIdempotencyKey } from '@/lib/idempotency'
import { usePdf } from '@/lib/usePdf'
import { cashDirection } from '../labels'
import { TransactionReceipt } from './TransactionReceipt'

const REASON_MAX = 255

/**
 * T7: reverse one of the teller's own transactions. The supervisor types their
 * own username and password on this screen; nothing of it is kept after closing.
 */
export function CorrectionDialogBody({
  original,
  onPendingChange,
  onClose,
}: {
  original: Transaction
  onPendingChange: (pending: boolean) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const reasonId = useId()
  const [idempotencyKey] = useState(newIdempotencyKey)
  const [reason, setReason] = useState('')
  const [supervisorUsername, setSupervisorUsername] = useState('')
  const [supervisorPassword, setSupervisorPassword] = useState('')
  const pdf = usePdf()

  const mutation = useMutation<RecordedTransaction, ApiError>({
    mutationFn: () =>
      correctTransaction(
        original.id,
        {
          reason: reason.trim(),
          supervisor_username: supervisorUsername.trim(),
          supervisor_password: supervisorPassword,
        },
        idempotencyKey,
      ),
    onMutate: () => onPendingChange(true),
    onSettled: () => onPendingChange(false),
    onError: () => setSupervisorPassword(''),
  })

  if (mutation.data) {
    const { transaction, replayed } = mutation.data
    return (
      <>
        <TransactionReceipt transaction={transaction} replayed={replayed} title="Koreksi tercatat" />
        <p className="text-[13px] text-ink-600">
          Transaksi #{original.id} sudah dibatalkan. Jika nominal yang benar perlu dicatat, buat transaksi baru untuk
          nasabah ini.
        </p>
        {pdf.error && <Alert>{pdf.error.message}</Alert>}
        <DialogActions>
          <Button
            variant="secondary"
            icon="printer"
            loading={pdf.pendingKey !== null}
            onClick={() =>
              void pdf.open('receipt', () => fetchReceiptPdf(transaction.id), `struk-${transaction.id}.pdf`)
            }
          >
            Cetak struk
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button
            data-autofocus
            onClick={() => {
              onClose()
              navigate(`/teller/counter?q=${encodeURIComponent(original.customer.account_number)}`)
            }}
          >
            Catat nominal yang benar
          </Button>
        </DialogActions>
      </>
    )
  }

  const error = mutation.error
  const pending = mutation.isPending
  const fieldErrors = error?.kind === 'validation'
  const reasonError = fieldErrors ? error.field('reason') : undefined
  const shownField =
    fieldErrors && (error.field('reason') ?? error.field('supervisor_username') ?? error.field('supervisor_password'))
  const canSubmit =
    !pending && reason.trim() !== '' && supervisorUsername.trim() !== '' && supervisorPassword !== ''
  const direction = cashDirection(original.type)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (canSubmit) mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-lg bg-ink-50 px-4 py-3">
        <div className="min-w-0 text-[13px] leading-snug">
          <p className="font-medium text-ink-900">
            {original.type_label} <span className="font-mono text-ink-500">#{original.id}</span>
          </p>
          <p className="truncate text-ink-600">
            {original.customer.full_name} · <span className="font-mono">{original.customer.account_number}</span>
          </p>
          <p className="text-ink-500">{formatDateTime(original.created_at)}</p>
        </div>
        <Amount
          value={direction === 'in' ? original.amount : -original.amount}
          sign
          size="md"
          tone={direction === 'in' ? 'in' : 'default'}
        />
      </div>
      <p className="flex gap-2 text-[13px] text-ink-600">
        <Icon name="undo" className="mt-0.5 size-4 text-ink-500" />
        Koreksi membatalkan seluruh nominal ini dengan transaksi kebalikan. Transaksi asli tetap tercatat.
      </p>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <FieldLabel htmlFor={reasonId}>Alasan koreksi</FieldLabel>
          <span className="text-xs text-ink-400">
            {reason.length}/{REASON_MAX}
          </span>
        </div>
        <textarea
          id={reasonId}
          data-autofocus
          rows={2}
          maxLength={REASON_MAX}
          disabled={pending}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Contoh: salah ketik nominal, seharusnya Rp7.000"
          aria-invalid={reasonError ? true : undefined}
          aria-describedby={describedBy(reasonId, reasonError)}
          className={`resize-y px-3 py-2 text-sm ${controlClass(Boolean(reasonError))}`}
        />
        <FieldMessage id={reasonId} error={reasonError} />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-ink-200 p-4">
        <legend className="flex items-center gap-1.5 px-1 text-[13px] font-semibold text-ink-900">
          <Icon name="lock" className="size-3.5 text-ink-500" />
          Otorisasi supervisor
        </legend>
        <p className="-mt-1 text-[13px] text-ink-500">Diisi langsung oleh supervisor. Data ini tidak disimpan.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Username supervisor"
            autoComplete="off"
            disabled={pending}
            value={supervisorUsername}
            onChange={(e) => setSupervisorUsername(e.target.value)}
            error={fieldErrors ? error.field('supervisor_username') : undefined}
          />
          <TextField
            label="Password supervisor"
            type="password"
            autoComplete="off"
            disabled={pending}
            value={supervisorPassword}
            onChange={(e) => setSupervisorPassword(e.target.value)}
            error={fieldErrors ? error.field('supervisor_password') : undefined}
          />
        </div>
      </fieldset>

      {error?.kind === 'network' && (
        <Alert tone="warning" title="Status koreksi belum diketahui">
          Koneksi terputus sebelum server menjawab. Kirim ulang: koreksi yang sama tidak akan tercatat dua kali.
        </Alert>
      )}
      {error && error.kind !== 'network' && !shownField && <Alert title="Koreksi tidak dicatat">{error.message}</Alert>}

      <DialogActions>
        <Button variant="secondary" disabled={pending} onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" variant="danger" disabled={!canSubmit} loading={pending}>
          {error?.kind === 'network' ? 'Kirim ulang' : `Batalkan transaksi #${original.id}`}
        </Button>
      </DialogActions>
    </form>
  )
}
