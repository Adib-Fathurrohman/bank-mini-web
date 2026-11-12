import { useEffect, useRef, useState, type ReactNode } from 'react'
import { fetchReceiptPdf } from '@/api/endpoints/teller'
import type { WithdrawalAuthorization } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Badge, type BadgeTone } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Eyebrow, Panel } from '@/components/Page'
import { Spinner } from '@/components/Spinner'
import { formatTime } from '@/lib/datetime'
import { countsFromList, fillFromDrawer, matchesAmount, toNotesPayload, type DenominationCounts } from '@/lib/denominations'
import { formatRupiah } from '@/lib/money'
import { usePdf } from '@/lib/usePdf'
import { authorizationWindow, useCountdown, type WithdrawalFlow } from '../withdrawalAuthorization'
import { NotesGrid } from './NotesGrid'
import { TransactionReceipt } from './TransactionReceipt'

const STATUS_TONE: Record<WithdrawalAuthorization['status'], BadgeTone> = {
  pending: 'warning',
  approved: 'info',
  consumed: 'success',
  rejected: 'danger',
  expired: 'neutral',
  cancelled: 'neutral',
}

function formatRemaining(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Ring that empties as the current deadline approaches. */
function CountdownRing({ remaining, total, tone }: { remaining: number; total: number; tone: 'warn' | 'pos' }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const fraction = total > 0 ? Math.min(1, remaining / total) : 0
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="5" className="stroke-ink-100" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className={`transition-[stroke-dashoffset] duration-300 ${tone === 'warn' ? 'stroke-warn-500' : 'stroke-pos-600'}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-xl font-semibold text-ink-900">{formatRemaining(remaining)}</span>
        <span className="mt-1 text-2xs text-ink-500">{remaining > 0 ? 'tersisa' : 'memeriksa…'}</span>
      </div>
    </div>
  )
}

type StepState = 'done' | 'current' | 'failed' | 'todo'

function Steps({ steps }: { steps: Array<{ label: string; detail?: string; state: StepState }> }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3 sm:gap-2">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-start gap-2.5 sm:flex-col sm:gap-2">
          <div className="flex items-center gap-2 sm:w-full">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.state === 'done'
                  ? 'bg-pos-600 text-white'
                  : step.state === 'current'
                    ? 'bg-white text-brand-700 ring-2 ring-brand-600'
                    : step.state === 'failed'
                      ? 'bg-neg-600 text-white'
                      : 'bg-ink-100 text-ink-500'
              }`}
            >
              {step.state === 'done' ? (
                <Icon name="check" className="size-3.5" />
              ) : step.state === 'failed' ? (
                <Icon name="x" className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`hidden h-px flex-1 sm:block ${step.state === 'done' ? 'bg-pos-600' : 'bg-ink-200'}`}
              />
            )}
          </div>
          <div className="leading-tight">
            <p className={`text-[13px] ${step.state === 'todo' ? 'text-ink-500' : 'font-medium text-ink-900'}`}>
              {step.label}
              <span className="sr-only">
                {step.state === 'done' ? ' (selesai)' : step.state === 'current' ? ' (sedang berjalan)' : ''}
              </span>
            </p>
            {step.detail && <p className="text-xs text-ink-500">{step.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

function stepsFor(a: WithdrawalAuthorization): Array<{ label: string; detail?: string; state: StepState }> {
  const sent = { label: 'Dikirim ke aplikasi', detail: `${formatTime(a.created_at)} WIB`, state: 'done' as StepState }
  const approval = { label: 'Persetujuan nasabah', detail: undefined as string | undefined, state: 'todo' as StepState }
  const record = { label: 'Penarikan dicatat', detail: undefined as string | undefined, state: 'todo' as StepState }

  if (a.approved_at) approval.detail = `${formatTime(a.approved_at)} WIB`
  switch (a.status) {
    case 'pending':
      approval.state = 'current'
      break
    case 'approved':
      approval.state = 'done'
      record.state = 'current'
      break
    case 'consumed':
      approval.state = 'done'
      record.state = 'done'
      if (a.consumed_at) record.detail = `${formatTime(a.consumed_at)} WIB`
      break
    case 'rejected':
      approval.state = 'failed'
      approval.detail = 'Ditolak nasabah'
      break
    case 'expired':
      if (a.approved_at) {
        approval.state = 'done'
        record.state = 'failed'
        record.detail = 'Waktu habis'
      } else {
        approval.state = 'failed'
        approval.detail = 'Waktu habis'
      }
      break
    case 'cancelled':
      if (a.approved_at) {
        approval.state = 'done'
        record.state = 'failed'
      } else approval.state = 'failed'
      break
  }
  return [sent, approval, record]
}

/**
 * T4 withdrawal, Mode A: waiting for the customer's approval in their app,
 * then completing. Polls the server; the countdown follows the server clock.
 */
export function WithdrawalApproval({
  flow,
  drawer,
  onAnotherTransaction,
  onNextCustomer,
}: {
  flow: WithdrawalFlow
  /** What the drawer holds now (shift tracked per denomination), or null for an older shift. */
  drawer: Array<{ denomination: number; quantity: number }> | null
  onAnotherTransaction: () => void
  onNextCustomer: () => void
}) {
  const a = flow.current
  const tracked = drawer !== null
  const held = countsFromList(drawer)
  const [paid, setPaid] = useState<DenominationCounts>({})
  const [autoFillFailed, setAutoFillFailed] = useState(false)
  const notesReady = !tracked || (a !== null && matchesAmount(a.amount, paid))
  const pdf = usePdf()
  const completeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const window_ = a ? authorizationWindow(a) : null
  const remaining = useCountdown(window_?.deadline ?? null, a?.server_time ?? null, flow.receivedAt)

  // On narrow screens the panel sits below the customer: bring each new request into view.
  useEffect(() => {
    if (a?.id) panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [a?.id])

  // A different request starts with an empty grid.
  useEffect(() => {
    setPaid({})
    setAutoFillFailed(false)
  }, [a?.id])

  // When the customer approves, put the teller's next action under Enter (with notes to enter, the grid comes first).
  useEffect(() => {
    if (a?.status === 'approved' && !tracked) completeRef.current?.focus()
  }, [a?.status, tracked])

  function complete() {
    flow.complete.mutate(tracked ? toNotesPayload(paid) : undefined)
  }

  function autoFill() {
    if (!a) return
    const filled = fillFromDrawer(a.amount, held)
    setAutoFillFailed(filled === null)
    if (filled) setPaid(filled)
  }

  if (flow.recorded) {
    const { transaction, replayed } = flow.recorded
    return (
      <Panel className="p-4 sm:p-5">
        <TransactionReceipt
          transaction={transaction}
          replayed={replayed}
          title="Tarik tunai tercatat"
          headingRef={(el) => el?.focus()}
        >
          <Button
            variant="secondary"
            icon="printer"
            loading={pdf.pendingKey !== null}
            onClick={() => void pdf.open('receipt', () => fetchReceiptPdf(transaction.id), `struk-${transaction.id}.pdf`)}
          >
            Cetak struk
          </Button>
          <Button variant="secondary" onClick={onNextCustomer}>
            Nasabah berikutnya
          </Button>
          <Button onClick={onAnotherTransaction}>Transaksi lain</Button>
        </TransactionReceipt>
        {pdf.error && <Alert className="mt-3">{pdf.error.message}</Alert>}
        <p className="mt-3 text-[13px] text-ink-600">Serahkan uang tunai {formatRupiah(transaction.amount)} kepada nasabah.</p>
      </Panel>
    )
  }

  if (!a) {
    return (
      <Panel className="p-5">
        {flow.pollError ? (
          <Alert title="Permintaan penarikan tidak dapat dimuat">{flow.pollError.message}</Alert>
        ) : (
          <div role="status" className="flex items-center gap-2 text-sm text-ink-500">
            <Spinner className="size-4" /> Memuat permintaan penarikan…
          </div>
        )}
      </Panel>
    )
  }

  const final = !window_
  let message: ReactNode = null
  let actions: ReactNode = null
  const newRequest = (
    <Button onClick={onAnotherTransaction} key="new">
      Buat permintaan baru
    </Button>
  )

  switch (a.status) {
    case 'pending':
      message = (
        <div className="flex gap-3 text-sm text-ink-700">
          <Icon name="phone" className="mt-0.5 size-4 text-warn-700" />
          <p>
            Minta nasabah membuka aplikasi Bank Mini dan menyetujui penarikan dengan PIN di ponselnya. Halaman ini
            diperbarui otomatis.
          </p>
        </div>
      )
      actions = (
        <Button variant="secondary" loading={flow.cancel.isPending} onClick={() => flow.cancel.mutate()}>
          Batalkan permintaan
        </Button>
      )
      break
    case 'approved':
      message = (
        <>
          <Alert tone="success" title="Nasabah sudah menyetujui">
            {tracked
              ? `Ambil uang dari laci dan isi pecahan yang diserahkan, lalu selesaikan penarikan sebelum waktu habis.`
              : `Selesaikan penarikan sebelum waktu habis, lalu serahkan uang tunai ${formatRupiah(a.amount)}.`}
          </Alert>
          {tracked && (
            <NotesGrid
              label="Uang dibayarkan"
              amount={a.amount}
              counts={paid}
              onChange={(next) => {
                setPaid(next)
                // A refusal was about the previous notes.
                if (flow.complete.isError && flow.complete.error?.kind !== 'network') flow.complete.reset()
              }}
              limits={held}
              shortages={flow.complete.error?.shortages}
              onAutoFill={autoFill}
              disabled={flow.complete.isPending || flow.complete.error?.kind === 'network'}
            />
          )}
          {autoFillFailed && (
            <Alert tone="warning">
              Uang di laci tidak dapat membayar {formatRupiah(a.amount)} dengan pecahan yang tersedia. Pilih pecahan sendiri
              atau minta nasabah mengurangi nominal.
            </Alert>
          )}
        </>
      )
      actions = (
        <>
          <Button
            variant="secondary"
            disabled={flow.complete.isPending}
            loading={flow.cancel.isPending}
            onClick={() => flow.cancel.mutate()}
          >
            Batalkan
          </Button>
          <Button
            ref={completeRef}
            size="lg"
            icon="check"
            loading={flow.complete.isPending}
            disabled={!notesReady}
            onClick={complete}
          >
            {flow.complete.error?.kind === 'network' ? 'Kirim ulang' : 'Selesaikan penarikan'}
          </Button>
        </>
      )
      break
    case 'rejected':
      message = <Alert title="Nasabah menolak penarikan">Tidak ada uang yang keluar. Buat permintaan baru bila perlu.</Alert>
      actions = newRequest
      break
    case 'expired':
      message = (
        <Alert tone="warning" title="Waktu persetujuan habis">
          {a.approved_at
            ? 'Penarikan tidak diselesaikan dalam 2 menit setelah disetujui. Tidak ada uang yang keluar.'
            : 'Nasabah tidak menyetujui dalam 2 menit. Tidak ada uang yang keluar.'}
        </Alert>
      )
      actions = newRequest
      break
    case 'cancelled':
      message = (
        <Alert tone="info" title="Permintaan dibatalkan">
          {a.cancel_reason === 'shift_closed' ? 'Dibatalkan otomatis karena shift ditutup.' : 'Dibatalkan oleh teller.'}{' '}
          Tidak ada uang yang keluar.
        </Alert>
      )
      actions = newRequest
      break
    case 'consumed':
      // Completed elsewhere (another tab) or the response was lost: the server has the transaction.
      message = (
        <Alert tone="success" title="Penarikan sudah tercatat">
          {a.transaction_id !== null && <>No. transaksi #{a.transaction_id}. </>}Serahkan uang tunai{' '}
          {formatRupiah(a.amount)} bila belum.
        </Alert>
      )
      actions = (
        <>
          {a.transaction_id !== null && (
            <Button
              variant="secondary"
              icon="printer"
              loading={pdf.pendingKey !== null}
              onClick={() =>
                void pdf.open('receipt', () => fetchReceiptPdf(a.transaction_id!), `struk-${a.transaction_id}.pdf`)
              }
            >
              Cetak struk
            </Button>
          )}
          <Button onClick={onAnotherTransaction}>Selesai</Button>
        </>
      )
      break
  }

  const actionError = flow.complete.error ?? flow.cancel.error

  return (
    <Panel ref={panelRef} className="scroll-mt-20">
      <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-4 py-3 sm:px-5">
        <Eyebrow>
          Tarik tunai<span className="hidden sm:inline"> · persetujuan nasabah</span>
        </Eyebrow>
        <Badge tone={STATUS_TONE[a.status]}>{a.status_label}</Badge>
      </div>

      <div className="flex flex-col gap-5 px-4 py-5 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Amount value={-a.amount} sign size="xl" />
            <p className="mt-1 text-[13px] text-ink-500 first-letter:uppercase">{a.amount_in_words}</p>
            {a.customer && (
              <p className="mt-2 text-sm text-ink-800">
                {a.customer.full_name} · <span className="font-mono text-[13px] text-ink-600">{a.customer.account_number}</span>
              </p>
            )}
          </div>
          {!final && remaining !== null && window_ && (
            <CountdownRing
              remaining={remaining}
              total={Date.parse(window_.deadline) - Date.parse(window_.start)}
              tone={a.status === 'pending' ? 'warn' : 'pos'}
            />
          )}
        </div>

        <Steps steps={stepsFor(a)} />

        <div aria-live="polite" className="flex flex-col gap-3">
          {message}
          {flow.pollError && !final && (
            <p className="flex items-center gap-2 text-[13px] text-warn-800">
              <Icon name="wifiOff" className="size-4" />
              Koneksi terputus, mencoba lagi… Permintaan tetap tersimpan di server.
            </p>
          )}
          {actionError &&
            (actionError.kind === 'network' ? (
              <Alert tone="warning" title="Status belum diketahui">
                Koneksi terputus sebelum server menjawab. Coba lagi: penarikan yang sama tidak akan tercatat dua kali.
              </Alert>
            ) : (
              <Alert>{actionError.message}</Alert>
            ))}
          {pdf.error && <Alert>{pdf.error.message}</Alert>}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-ink-200 bg-ink-50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-5">
        {final && (
          <Button variant="ghost" className="sm:mr-auto" onClick={onNextCustomer}>
            Nasabah berikutnya
          </Button>
        )}
        {actions}
      </div>
    </Panel>
  )
}
