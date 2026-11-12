import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { executeClassPromotion } from '@/api/endpoints/graduation'
import type { ApiError } from '@/api/errors'
import type { ClassPromotion } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { Dialog, DialogActions } from '@/components/Dialog'
import { PageHeader, Panel } from '@/components/Page'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { TextField } from '@/components/TextField'
import { promotionBlockedReason, runErrorMessage } from './graduation'
import { useClassPromotionPreview, useRefreshSchoolYear } from './queries'

/**
 * Kenaikan kelas, once a year right after the graduation of class XII: every open
 * account moves up one class (X → XI, XI → XII), except the students ticked "Tinggal
 * kelas". Only the class changes; account numbers, balances and history stay.
 */
export function ClassPromotionPage() {
  const navigate = useNavigate()
  const preview = useClassPromotionPreview()
  const refresh = useRefreshSchoolYear()
  const rows = useMemo(() => preview.data?.data ?? [], [preview.data])
  const summary = preview.data?.summary

  const [retained, setRetained] = useState<Set<number>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [note, setNote] = useState('')

  const blocked = summary ? promotionBlockedReason(summary) : null
  const retainedIds = rows.filter((r) => retained.has(r.id)).map((r) => r.id)
  const promoting = rows.length - retainedIds.length

  const run = useMutation<ClassPromotion, ApiError>({
    mutationFn: async () =>
      (
        await executeClassPromotion({
          customer_ids: rows.map((r) => r.id),
          retained_customer_ids: retainedIds,
          ...(note.trim() ? { note: note.trim() } : {}),
        })
      ).data,
    onSuccess: async (promotion) => {
      await refresh()
      void navigate(`/class-promotions/${promotion.id}`, { state: { justRan: true } })
    },
  })
  const failure = run.error ? runErrorMessage(run.error) : null

  function toggle(id: number) {
    setRetained((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function reload() {
    run.reset()
    setConfirming(false)
    setRetained(new Set())
    void preview.refetch()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kenaikan Kelas"
        description={
          summary
            ? `Tahun ajaran ${summary.school_year}. Setiap rekening naik satu kelas; centang “Tinggal kelas” untuk siswa yang tidak naik.`
            : 'Setiap rekening naik satu kelas; centang “Tinggal kelas” untuk siswa yang tidak naik.'
        }
        actions={
          <Link to="/class-promotions" className={buttonClass('secondary')}>
            Riwayat kenaikan kelas
          </Link>
        }
      />

      {summary && (
        <dl aria-label="Ringkasan kenaikan kelas" className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 md:grid-cols-4">
          {[
            { label: 'Kelas X → XI', value: summary.x_count, warn: false },
            { label: 'Kelas XI → XII', value: summary.xi_count, warn: false },
            { label: 'Kelas XII masih terbuka', value: summary.open_xii_count, warn: summary.open_xii_count > 0 },
            { label: 'Tahun ajaran', value: summary.school_year, warn: false },
          ].map((cell) => (
            <div key={cell.label} className={`flex flex-col gap-1 px-4 py-3 md:py-4 ${cell.warn ? 'bg-warn-50' : 'bg-white'}`}>
              <dt className="text-[13px] text-ink-500">{cell.label}</dt>
              <dd className="text-2xl font-semibold tracking-tight text-ink-900">{cell.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {blocked && (
        <Alert
          tone="warning"
          title={blocked.kind === 'done' ? 'Kenaikan kelas sudah dijalankan' : 'Kenaikan kelas belum dapat dijalankan'}
          action={
            blocked.kind === 'xii' && (
              <Link to="/admin/graduation" className={buttonClass('secondary', 'sm')}>
                Ke Kelulusan
              </Link>
            )
          }
        >
          {blocked.message}
        </Alert>
      )}

      <Panel className="overflow-hidden">
        {preview.isPending ? (
          <SkeletonRows />
        ) : preview.error ? (
          <div className="p-4">
            <LoadError error={preview.error} onRetry={() => void preview.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="Tidak ada rekening di kelas X atau XI" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                  Nama
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">
                  Rekening
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Kelas
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Tinggal kelas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((r) => {
                const stays = retained.has(r.id)
                return (
                  <tr key={r.id} className={stays ? 'bg-warn-50/60' : ''}>
                    <td className="max-w-60 py-2.5 pr-3 pl-4">
                      <span className="block truncate text-ink-900">{r.full_name}</span>
                      <span className="text-xs text-ink-500">
                        {r.major_name} {r.group} · NIS {r.nis}
                      </span>
                    </td>
                    <td className="hidden py-2.5 pr-3 font-mono text-[13px] text-ink-700 sm:table-cell">{r.account_number}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-ink-800">
                      {r.class} → <span className={stays ? 'text-warn-800' : 'font-medium text-ink-900'}>{stays ? r.class : r.next_class}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <input
                        type="checkbox"
                        aria-label={`Tinggal kelas: ${r.full_name}`}
                        checked={stays}
                        disabled={blocked !== null || run.isPending}
                        onChange={() => toggle(r.id)}
                        className="size-4 accent-brand-600"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Panel>

      {summary && rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-ink-900">{promoting}</span> naik kelas ·{' '}
            <span className="font-semibold text-ink-900">{retainedIds.length}</span> tinggal kelas
          </p>
          <Button disabled={blocked !== null} onClick={() => setConfirming(true)}>
            Jalankan kenaikan kelas
          </Button>
        </div>
      )}

      <Dialog
        open={confirming && summary !== undefined}
        onClose={() => !run.isPending && setConfirming(false)}
        dismissable={!run.isPending}
        size="sm"
        title={`Naikkan kelas tahun ajaran ${summary?.school_year ?? ''}?`}
        description="Dijalankan sekali per tahun ajaran dan tidak dapat dibatalkan lewat aplikasi."
      >
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-ink-50 px-3 py-3">
            <p className="text-2xl font-semibold text-ink-900">{promoting}</p>
            <p className="text-[13px] text-ink-600">naik satu kelas</p>
          </div>
          <div className="rounded-lg bg-ink-50 px-3 py-3">
            <p className="text-2xl font-semibold text-ink-900">{retainedIds.length}</p>
            <p className="text-[13px] text-ink-600">tinggal kelas</p>
          </div>
        </div>
        <TextField
          label="Catatan (opsional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={255}
          disabled={run.isPending}
          data-autofocus
        />
        {failure && (
          <Alert
            title="Kenaikan kelas tidak dijalankan"
            action={
              failure.reload && (
                <Button variant="secondary" size="sm" onClick={reload}>
                  Muat ulang pratinjau
                </Button>
              )
            }
          >
            {failure.message} Tidak ada kelas yang berubah.
          </Alert>
        )}
        <DialogActions>
          <Button variant="secondary" disabled={run.isPending} onClick={() => setConfirming(false)}>
            Batal
          </Button>
          <Button loading={run.isPending} onClick={() => run.mutate()}>
            Naikkan kelas
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
