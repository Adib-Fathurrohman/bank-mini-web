import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { fetchReceiptPdf } from '@/api/endpoints/teller'
import type { Transaction } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { Button, IconButton } from '@/components/Button'
import { Dialog, DialogActions } from '@/components/Dialog'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { controlClass } from '@/components/TextField'
import { formatDate, jakartaToday } from '@/lib/datetime'
import { usePdf } from '@/lib/usePdf'
import { CorrectionDialogBody } from './components/CorrectionDialog'
import { TransactionReceipt } from './components/TransactionReceipt'
import { TransactionTable } from './components/TransactionTable'
import { canCorrect, correctedIds } from './correctionEligibility'
import { useRefreshTeller, useShift, useTransactions } from './queries'
import { activeShift } from './shiftGate'

type Open = { kind: 'detail' | 'correct'; transaction: Transaction }

/** T6: own transactions of a day, details, receipt reprint, and the entry point for corrections (T7). */
export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const date = searchParams.get('date') ?? undefined
  const page = Number(searchParams.get('page') ?? '1') || 1

  const shift = useShift()
  const list = useTransactions(date, page)
  const refresh = useRefreshTeller()
  const pdf = usePdf()
  const [open, setOpen] = useState<Open | null>(null)
  const [correctionPending, setCorrectionPending] = useState(false)

  const gate = shift.data
  const active = gate ? activeShift(gate) : null
  // The shift list is complete for the active shift and lacks `corrected_by` (FRONTEND_AUDIT.md §6.4).
  const corrected = useMemo(() => correctedIds(gate && 'transactions' in gate ? gate.transactions : []), [gate])
  const correctable = (t: Transaction) => canCorrect(t, active?.id ?? null, corrected)

  function setParams(next: { date?: string; page?: number }) {
    const params: Record<string, string> = {}
    if (next.date) params.date = next.date
    if (next.page && next.page > 1) params.page = String(next.page)
    setSearchParams(params)
  }

  function closeDialog() {
    const wasCorrecting = open?.kind === 'correct'
    setOpen(null)
    if (wasCorrecting) void refresh()
  }

  function printReceipt(t: Transaction) {
    void pdf.open(`receipt-${t.id}`, () => fetchReceiptPdf(t.id), `struk-${t.id}.pdf`)
  }

  const shownDate = date ?? jakartaToday()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transaksi & koreksi"
        description="Transaksi yang Anda catat. Koreksi hanya untuk setoran dan penarikan pada shift yang masih aktif."
        actions={
          <>
            <label className="sr-only" htmlFor="transactions-date">
              Tanggal
            </label>
            <input
              id="transactions-date"
              type="date"
              value={shownDate}
              max={jakartaToday()}
              onChange={(e) => setParams({ date: e.target.value || undefined })}
              className={`h-9 px-3 text-sm ${controlClass(false)}`}
            />
            {date && (
              <Button variant="secondary" onClick={() => setParams({})}>
                Hari ini
              </Button>
            )}
          </>
        }
      />

      {gate?.kind === 'stale' && date !== gate.shift.report_date && (
        <Alert
          tone="warning"
          title={`Shift tanggal ${formatDate(gate.shift.report_date)} masih aktif`}
          action={
            <Button variant="secondary" size="sm" onClick={() => setParams({ date: gate.shift.report_date })}>
              Lihat transaksi shift itu
            </Button>
          }
        >
          Koreksi hanya dapat dilakukan pada transaksi shift tersebut.
        </Alert>
      )}

      {pdf.error && <Alert>{pdf.error.message}</Alert>}

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-200 px-4 py-3">
          <h2 className="text-[15px] font-semibold text-ink-900">{formatDate(shownDate)}</h2>
          {list.data && <span className="text-[13px] text-ink-500">{list.data.meta.total} transaksi</span>}
        </div>
        {list.isPending ? (
          <SkeletonRows />
        ) : list.error ? (
          <div className="p-4">
            <LoadError error={list.error} onRetry={() => void list.refetch()} />
          </div>
        ) : list.data.data.length === 0 ? (
          <EmptyState title="Belum ada transaksi">Tidak ada transaksi yang Anda catat pada tanggal ini.</EmptyState>
        ) : (
          <TransactionTable
            rows={list.data.data}
            corrected={corrected}
            actions={(t) => (
              <>
                <IconButton
                  icon="printer"
                  label={`Cetak struk #${t.id}`}
                  loading={pdf.pendingKey === `receipt-${t.id}`}
                  onClick={() => printReceipt(t)}
                />
                {correctable(t) && (
                  <Button variant="ghost" size="sm" onClick={() => setOpen({ kind: 'correct', transaction: t })}>
                    Koreksi
                  </Button>
                )}
                <IconButton
                  icon="chevronRight"
                  label={`Detail transaksi #${t.id}`}
                  onClick={() => setOpen({ kind: 'detail', transaction: t })}
                />
              </>
            )}
          />
        )}
      </Panel>
      {list.data && <Pagination meta={list.data.meta} onPage={(p) => setParams({ date, page: p })} />}

      <Dialog
        open={open !== null}
        onClose={closeDialog}
        dismissable={!correctionPending}
        title={open?.kind === 'correct' ? 'Koreksi transaksi' : `Transaksi #${open?.transaction.id ?? ''}`}
        size={open?.kind === 'correct' ? 'md' : 'sm'}
      >
        {open?.kind === 'correct' && (
          <CorrectionDialogBody
            original={open.transaction}
            onPendingChange={setCorrectionPending}
            onClose={closeDialog}
          />
        )}
        {open?.kind === 'detail' && (
          <>
            {(open.transaction.corrected_by || corrected.has(open.transaction.id)) && (
              <Badge tone="warning">
                Dikoreksi{open.transaction.corrected_by ? ` oleh #${open.transaction.corrected_by.id}` : ''}
              </Badge>
            )}
            <TransactionReceipt transaction={open.transaction} title={open.transaction.type_label} />
            {pdf.error && <Alert>{pdf.error.message}</Alert>}
            <DialogActions>
              {correctable(open.transaction) && (
                <Button variant="secondary" onClick={() => setOpen({ kind: 'correct', transaction: open.transaction })}>
                  Koreksi
                </Button>
              )}
              <Button
                icon="printer"
                data-autofocus
                loading={pdf.pendingKey === `receipt-${open.transaction.id}`}
                onClick={() => printReceipt(open.transaction)}
              >
                Cetak struk
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  )
}
