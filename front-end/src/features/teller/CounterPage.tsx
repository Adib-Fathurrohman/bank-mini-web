import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { fetchReceiptPdf, type RecordedTransaction } from '@/api/endpoints/teller'
import type { CustomerSummary, QrScannerMode } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Dialog } from '@/components/Dialog'
import { Icon } from '@/components/Icon'
import { MoneyInput } from '@/components/MoneyInput'
import { PageHeader, Panel } from '@/components/Page'
import { EmptyState, LoadError } from '@/components/QueryStatus'
import { TextField } from '@/components/TextField'
import { isInFuture } from '@/lib/datetime'
import { formatRupiah, validateTransactionAmount } from '@/lib/money'
import { usePdf } from '@/lib/usePdf'
import { DepositReview, WithdrawalRequestReview, type CounterTransactionType } from './components/CounterDialogs'
import { CustomerPanel, CustomerPanelSkeleton } from './components/CustomerPanel'
import { TransactionReceipt } from './components/TransactionReceipt'
import { WithdrawalApproval } from './components/WithdrawalApproval'
import { tellerKeys, useCustomerLookup, useRefreshTeller, useSettings, useShift } from './queries'
import { QrScannerButton } from './QrScanner'
import { canTransact } from './shiftGate'
import { isOpenAuthorization, useWithdrawalAuthorization } from './withdrawalAuthorization'
import { withdrawalBlocker } from './withdrawalPrecheck'

const SCANNER_HINT: Record<QrScannerMode, string> = {
  webcam: 'Pindai kartu dengan kamera, atau ketik nomor rekening / NIS.',
  usb: 'Arahkan scanner USB ke QR kartu, atau ketik nomor rekening / NIS.',
  disabled: 'Ketik nomor rekening atau NIS nasabah.',
}

const QUICK_AMOUNTS = [10_000, 20_000, 50_000, 100_000]

const TYPE_LABEL: Record<CounterTransactionType, string> = { deposit: 'Setor tunai', withdrawal: 'Tarik tunai' }

/** Setor / Tarik switch: a radio group operable with the arrow keys. */
function TypeSwitch({
  value,
  onChange,
}: {
  value: CounterTransactionType
  onChange: (type: CounterTransactionType) => void
}) {
  const refs = useRef<Partial<Record<CounterTransactionType, HTMLButtonElement | null>>>({})

  function handleKeyDown(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const next = value === 'deposit' ? 'withdrawal' : 'deposit'
    onChange(next)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Jenis transaksi"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-2 gap-1 rounded-lg bg-ink-100 p-1"
    >
      {(['deposit', 'withdrawal'] as const).map((t) => {
        const selected = value === t
        return (
          <button
            key={t}
            ref={(el) => {
              refs.current[t] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t)}
            className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm transition-colors ${
              selected ? 'bg-white font-medium text-ink-900 shadow-sm ring-1 ring-ink-200' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Icon
              name={t === 'deposit' ? 'arrowIn' : 'arrowOut'}
              className={`size-4 ${selected ? (t === 'deposit' ? 'text-pos-700' : 'text-ink-700') : ''}`}
            />
            {TYPE_LABEL[t]}
          </button>
        )
      })}
    </div>
  )
}

/** T2–T5: look up a customer and record a deposit, or request a withdrawal approved in the customer's app. */
export function CounterPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const identifier = searchParams.get('q') ?? ''
  const [typed, setTyped] = useState(identifier)
  const lookupRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const shift = useShift()
  const settings = useSettings()
  const lookup = useCustomerLookup(identifier)
  const flow = useWithdrawalAuthorization()
  const queryClient = useQueryClient()
  const refresh = useRefreshTeller()
  const pdf = usePdf()

  const [type, setType] = useState<CounterTransactionType>('deposit')
  const [amount, setAmount] = useState<number | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [depositPending, setDepositPending] = useState(false)
  const [deposited, setDeposited] = useState<RecordedTransaction | null>(null)

  const customer = lookup.data
  const mode = settings.data?.qr_scanner_mode ?? 'disabled'
  const minBalance = settings.data?.min_balance
  const transactAllowed = shift.data ? canTransact(shift.data) : false
  const withdrawalInProgress =
    flow.id !== null && !flow.recorded && (!flow.current || isOpenAuthorization(flow.current.status))

  // Keep the field in sync when the URL changes (e.g. "record the right amount" after a correction).
  useEffect(() => setTyped(identifier), [identifier])

  // A new customer starts a fresh form; focus the amount so the teller can keep typing.
  useEffect(() => {
    setAmount(null)
    setAmountError(null)
    setType('deposit')
    setDeposited(null)
    if (customer) amountRef.current?.focus()
  }, [customer?.account_number])

  // A request on screen (new or resumed after a reload) belongs to one customer: show that customer.
  const requestAccount = flow.current?.customer?.account_number
  useEffect(() => {
    if (flow.id === null) return
    setReviewing(false)
    if (requestAccount && requestAccount !== customer?.account_number && requestAccount !== identifier) {
      setSearchParams({ q: requestAccount })
    }
    // Only when the request changes, not on every lookup.
  }, [flow.id, requestAccount])

  // "/" jumps to the lookup field from anywhere on the page.
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable], dialog')) return
      event.preventDefault()
      lookupRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function search(value: string) {
    const next = value.trim()
    if (!next) return
    if (next === identifier) void lookup.refetch()
    else setSearchParams({ q: next })
  }

  function handleLookup(event: FormEvent) {
    event.preventDefault()
    search(typed)
  }

  function nextCustomer() {
    if (!withdrawalInProgress) flow.reset()
    setDeposited(null)
    setSearchParams({})
    setTyped('')
    lookupRef.current?.focus()
  }

  function anotherTransaction() {
    // After a recorded transaction start empty; after a refused/expired request keep the amount to resend.
    const done = Boolean(deposited) || Boolean(flow.recorded) || flow.current?.status === 'consumed'
    flow.reset()
    setDeposited(null)
    if (done) setAmount(null)
    // After the receipt unmounts, give the amount field the focus back.
    window.setTimeout(() => amountRef.current?.focus(), 0)
  }

  function blockerFor(t: CounterTransactionType, c: CustomerSummary): string | null {
    if (!transactAllowed) return 'Setor dan tarik tunai memerlukan shift yang berjalan hari ini.'
    if (c.account_status !== 'active') return 'Rekening tidak aktif untuk bertransaksi.'
    if (t === 'withdrawal') {
      if (!settings.data) return 'Pengaturan bank belum dimuat.'
      if (settings.data.withdrawal_verification === 'terminal') {
        return 'Persetujuan penarikan lewat aplikasi nasabah sedang dinonaktifkan administrator, sehingga penarikan tidak dapat diproses dari layar ini.'
      }
      if (isInFuture(c.pin_locked_until)) return 'PIN nasabah sedang diblokir; penarikan belum dapat diminta.'
    }
    return null
  }

  function handleProceed(event: FormEvent) {
    event.preventDefault()
    if (!customer) return
    const invalid = validateTransactionAmount(amount)
    if (invalid) return setAmountError(invalid)
    const blocked = blockerFor(type, customer)
    if (blocked) return setAmountError(blocked)
    // Withdrawal pre-checks before the customer is asked in the app; the server re-checks.
    if (type === 'withdrawal') {
      const precheck = withdrawalBlocker(customer, amount!, settings.data!.min_balance)
      if (precheck) return setAmountError(precheck)
    }
    setAmountError(null)
    flow.create.reset()
    setReviewing(true)
  }

  function closeReview() {
    setReviewing(false)
    // Refresh even without a recorded result: an unknown outcome may still have been saved.
    void refresh()
  }

  const blocker = customer ? blockerFor(type, customer) : null
  const amountValid = amount !== null && validateTransactionAmount(amount) === null
  const maxWithdrawal = customer && minBalance !== undefined ? Math.max(0, customer.balance - minBalance) : null
  const balanceAfter =
    customer && amountValid ? (type === 'deposit' ? customer.balance + amount! : customer.balance - amount!) : null
  const belowMinimum = type === 'withdrawal' && balanceAfter !== null && minBalance !== undefined && balanceAfter < minBalance

  let workArea
  if (flow.id !== null) {
    workArea = <WithdrawalApproval flow={flow} onAnotherTransaction={anotherTransaction} onNextCustomer={nextCustomer} />
  } else if (deposited) {
    const { transaction, replayed } = deposited
    workArea = (
      <Panel className="p-4 sm:p-5">
        <TransactionReceipt transaction={transaction} replayed={replayed} headingRef={(el) => el?.focus()}>
          <Button
            variant="secondary"
            icon="printer"
            loading={pdf.pendingKey !== null}
            onClick={() => void pdf.open('receipt', () => fetchReceiptPdf(transaction.id), `struk-${transaction.id}.pdf`)}
          >
            Cetak struk
          </Button>
          <Button variant="secondary" onClick={nextCustomer}>
            Nasabah berikutnya
          </Button>
          <Button onClick={anotherTransaction}>Transaksi lain</Button>
        </TransactionReceipt>
        {pdf.error && <Alert className="mt-3">{pdf.error.message}</Alert>}
      </Panel>
    )
  } else if (customer) {
    workArea = (
      <Panel>
        <form onSubmit={handleProceed} noValidate className="flex flex-col gap-5 p-4 sm:p-5">
          <TypeSwitch
            value={type}
            onChange={(t) => {
              setType(t)
              setAmountError(null)
            }}
          />

          <div className="flex flex-col gap-2">
            <MoneyInput
              ref={amountRef}
              size="xl"
              label={type === 'deposit' ? 'Nominal setor' : 'Nominal tarik'}
              value={amount}
              onChange={(value) => {
                setAmount(value)
                setAmountError(null)
              }}
              error={amountError ?? undefined}
              hint={
                type === 'withdrawal' && maxWithdrawal !== null
                  ? `Kelipatan Rp100 · maksimal ${formatRupiah(maxWithdrawal)}`
                  : 'Kelipatan Rp100 · maksimal Rp100.000.000'
              }
            />
            <div className="flex flex-wrap gap-1.5" aria-label="Nominal cepat">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={type === 'withdrawal' && maxWithdrawal !== null && value > maxWithdrawal}
                  onClick={() => {
                    setAmount(value)
                    setAmountError(null)
                    amountRef.current?.focus()
                  }}
                  className={`h-7 rounded-md border px-2.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:text-ink-300 ${
                    amount === value
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50'
                  }`}
                >
                  {formatRupiah(value)}
                </button>
              ))}
            </div>
          </div>

          <DataList className="border-t border-ink-200">
            <DataRow label="Saldo sekarang">{formatRupiah(customer.balance)}</DataRow>
            <DataRow label="Saldo sesudah" strong>
              {balanceAfter === null ? (
                '—'
              ) : (
                <span className={belowMinimum ? 'text-neg-700' : undefined}>{formatRupiah(balanceAfter)}</span>
              )}
            </DataRow>
          </DataList>

          {type === 'withdrawal' && !blocker && (
            <div className="flex gap-3 rounded-lg bg-brand-50 px-3.5 py-3 text-[13px] text-brand-900">
              <Icon name="phone" className="mt-0.5 size-4 text-brand-700" />
              <p>
                Nasabah menyetujui penarikan di aplikasi Bank Mini dengan PIN miliknya. Anda tidak memasukkan PIN.
              </p>
            </div>
          )}
          {blocker && (
            <Alert tone="warning" className="py-2.5">
              {blocker}
            </Alert>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={blocker !== null} icon={type === 'withdrawal' ? 'phone' : undefined}>
            {type === 'deposit' ? 'Lanjut ke konfirmasi' : 'Kirim ke aplikasi nasabah'}
          </Button>
        </form>
      </Panel>
    )
  } else {
    workArea = (
      <Panel className="hidden border-dashed lg:block">
        <EmptyState title="Belum ada nasabah">
          Cari nasabah di sebelah kiri. Setelah ditemukan, nominal bisa langsung diketik lalu Enter.
        </EmptyState>
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Layanan nasabah" />

      {shift.data && !transactAllowed && (
        <Alert
          tone="warning"
          title="Setor dan tarik tunai belum dapat dilakukan"
          action={
            <Link to="/teller" className={buttonClass('secondary', 'sm')}>
              Lihat shift
            </Link>
          }
        >
          Diperlukan shift yang berjalan hari ini. Pencarian nasabah tetap dapat dilakukan.
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Panel className="p-4">
            <form onSubmit={handleLookup} className="flex flex-col gap-3">
              <TextField
                ref={lookupRef}
                label="Cari nasabah"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                disabled={withdrawalInProgress}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="No. rekening, NIS, atau pindai QR"
                hint={withdrawalInProgress ? 'Selesaikan atau batalkan penarikan yang sedang berjalan.' : SCANNER_HINT[mode]}
                leading={<Icon name="search" />}
                trailing={
                  <kbd className="hidden rounded border border-ink-200 bg-ink-50 px-1.5 text-xs text-ink-500 sm:inline">/</kbd>
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={lookup.isFetching} disabled={withdrawalInProgress}>
                  Cari
                </Button>
                {mode === 'webcam' && !withdrawalInProgress && (
                  <QrScannerButton
                    onScan={(value) => {
                      setTyped(value)
                      search(value)
                    }}
                  />
                )}
                {identifier && !withdrawalInProgress && (
                  <Button variant="ghost" className="ml-auto" onClick={nextCustomer}>
                    Nasabah berikutnya
                  </Button>
                )}
              </div>
            </form>
          </Panel>

          {identifier && lookup.isPending && <CustomerPanelSkeleton />}
          {lookup.error &&
            (lookup.error.kind === 'notFound' ? (
              <Alert title="Nasabah tidak ditemukan">
                Tidak ada rekening dengan nomor atau NIS “{identifier}”. Periksa kembali; rekening yang sudah ditutup
                tidak dapat dicari.
              </Alert>
            ) : (
              <LoadError error={lookup.error} onRetry={() => void lookup.refetch()} />
            ))}
          {customer && <CustomerPanel customer={customer} minBalance={minBalance} />}
        </div>

        <div className="flex flex-col gap-4">{workArea}</div>
      </div>

      <Dialog
        open={reviewing && customer !== undefined && amount !== null}
        onClose={closeReview}
        dismissable={!depositPending && !flow.create.isPending}
        title={type === 'deposit' ? 'Konfirmasi setor tunai' : 'Kirim permintaan tarik tunai'}
        size="sm"
      >
        {customer &&
          amount !== null &&
          (type === 'deposit' ? (
            <DepositReview
              customer={customer}
              amount={amount}
              onPendingChange={setDepositPending}
              onCancel={closeReview}
              onRecorded={(result) => {
                setReviewing(false)
                setDeposited(result)
                void refresh()
              }}
            />
          ) : (
            <WithdrawalRequestReview
              customer={customer}
              amount={amount}
              flow={flow}
              onCancel={closeReview}
              onLocked={() => void queryClient.invalidateQueries({ queryKey: tellerKeys.lookup(identifier) })}
            />
          ))}
      </Dialog>
    </div>
  )
}
