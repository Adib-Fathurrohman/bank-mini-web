import { useId, useRef, useState } from 'react'
import type { ReviewDecision } from '@/api/endpoints/supervisor'
import type { DailyReport } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Button } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Dialog, DialogActions } from '@/components/Dialog'
import { Eyebrow, Panel } from '@/components/Page'
import { controlClass, describedBy, FieldLabel, FieldMessage } from '@/components/TextField'
import { formatDate, formatDateTime } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { useReviewReport } from '../queries'
import { allowedDecisions, NOTE_MAX, validateNote } from '../review'

/** Why there is nothing to decide on a report that is not awaiting review. */
function StatusNote({ report }: { report: DailyReport }) {
  if (report.status === 'open') {
    return <p className="text-sm text-ink-600">Shift masih berjalan. Laporan dapat ditinjau setelah teller menutup shift.</p>
  }
  if (report.status === 'rejected') {
    return (
      <p className="text-sm text-ink-600">
        Shift dibuka kembali untuk teller. Laporan menunggu teller memperbaiki dan menutup shift lagi.
      </p>
    )
  }
  return (
    <DataList>
      {report.supervisor && <DataRow label="Disetujui oleh">{report.supervisor.full_name}</DataRow>}
      {report.reviewed_at && <DataRow label="Waktu">{formatDateTime(report.reviewed_at)}</DataRow>}
      {report.cash_transfer && (
        <DataRow label="Masuk brankas" strong>
          {formatRupiah(report.cash_transfer.amount)}
        </DataRow>
      )}
    </DataList>
  )
}

/**
 * The decision on one report: approve (confirmed; final, books the counted cash
 * into the vault), hold (note required) or reject (confirmed, note required;
 * the teller's shift reopens).
 */
export function ReviewPanel({
  report,
  onDecided,
}: {
  report: DailyReport
  onDecided: (decision: ReviewDecision, result: DailyReport) => void
}) {
  const noteId = useId()
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<'approve' | 'reject' | null>(null)
  const review = useReviewReport(report.id)
  const decisions = allowedDecisions(report.status)
  const pending = review.isPending
  const vaultAmount = report.physical_balance ?? report.system_balance ?? 0

  if (decisions.length === 0) {
    return (
      <Panel className="flex flex-col gap-2 p-4">
        <Eyebrow>Keputusan</Eyebrow>
        <StatusNote report={report} />
      </Panel>
    )
  }

  function start(decision: ReviewDecision) {
    const error = validateNote(decision, note)
    setNoteError(error)
    if (error) {
      noteRef.current?.focus()
      return
    }
    review.reset()
    if (decision === 'hold') submit('hold')
    else setConfirming(decision)
  }

  function submit(decision: ReviewDecision) {
    review.mutate(
      { decision, note: note.trim() },
      {
        onSuccess: (result) => {
          setConfirming(null)
          setNote('')
          onDecided(decision, result)
        },
        onError: () => setConfirming(null),
      },
    )
  }

  const serverNoteError = review.error?.kind === 'validation' ? review.error.field('note') : undefined
  const shownNoteError = noteError ?? serverNoteError

  return (
    <Panel className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <Eyebrow>Keputusan</Eyebrow>
        <p className="text-[13px] text-ink-600">Kas yang masuk brankas bila disetujui</p>
        <Amount value={vaultAmount} size="lg" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <FieldLabel htmlFor={noteId}>Catatan</FieldLabel>
          <span className="text-xs text-ink-400">
            {note.length}/{NOTE_MAX}
          </span>
        </div>
        <textarea
          ref={noteRef}
          id={noteId}
          rows={3}
          maxLength={NOTE_MAX}
          disabled={pending}
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            if (noteError) setNoteError(null)
          }}
          placeholder="Contoh: sesuai, kas diterima di brankas"
          aria-invalid={shownNoteError ? true : undefined}
          aria-describedby={describedBy(noteId, shownNoteError, true)}
          className={`resize-y px-3 py-2 text-sm ${controlClass(Boolean(shownNoteError))}`}
        />
        <FieldMessage id={noteId} error={shownNoteError} hint="Wajib untuk Tahan dan Tolak. Catatan terlihat oleh teller." />
      </div>

      {review.error && !serverNoteError && (
        <Alert title="Keputusan tidak disimpan">
          {review.error.message}
          {review.error.kind === 'network' && ' Muat ulang halaman untuk melihat status terbaru sebelum mencoba lagi.'}
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Button size="lg" icon="check" disabled={pending} onClick={() => start('approve')}>
          Setujui
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {decisions.includes('hold') && (
            <Button variant="secondary" loading={pending && review.variables?.decision === 'hold'} disabled={pending} onClick={() => start('hold')}>
              Tahan
            </Button>
          )}
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => start('reject')}
            className={decisions.includes('hold') ? '' : 'col-span-2'}
          >
            Tolak
          </Button>
        </div>
      </div>

      <Dialog
        open={confirming === 'approve'}
        onClose={() => setConfirming(null)}
        dismissable={!pending}
        size="sm"
        title="Setujui laporan harian?"
        description="Persetujuan bersifat final. Kas dari laci teller dicatat masuk ke brankas."
      >
        <DataList>
          <DataRow label="Teller">{report.teller?.full_name ?? '—'}</DataRow>
          <DataRow label="Tanggal">{formatDate(report.report_date)}</DataRow>
          <DataRow label="Masuk brankas" strong>
            {formatRupiah(vaultAmount)}
          </DataRow>
          {note.trim() && <DataRow label="Catatan">{note.trim()}</DataRow>}
        </DataList>
        <DialogActions>
          <Button variant="secondary" disabled={pending} onClick={() => setConfirming(null)}>
            Batal
          </Button>
          <Button data-autofocus icon="check" loading={pending} onClick={() => submit('approve')}>
            Setujui
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirming === 'reject'}
        onClose={() => setConfirming(null)}
        dismissable={!pending}
        size="sm"
        title="Tolak laporan harian?"
        description={`Shift ${report.teller?.full_name ?? 'teller'} dibuka kembali agar teller dapat mengoreksi dan menutupnya lagi.`}
      >
        <div className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-800">
          <p className="text-xs font-medium text-ink-500">Catatan untuk teller</p>
          <p className="mt-1 break-words">“{note.trim()}”</p>
        </div>
        <DialogActions>
          <Button variant="secondary" disabled={pending} onClick={() => setConfirming(null)}>
            Batal
          </Button>
          <Button data-autofocus variant="danger" loading={pending} onClick={() => submit('reject')}>
            Tolak laporan
          </Button>
        </DialogActions>
      </Dialog>
    </Panel>
  )
}
