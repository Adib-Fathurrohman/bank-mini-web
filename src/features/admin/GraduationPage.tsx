import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { executeGraduation } from '@/api/endpoints/graduation'
import type { ApiError } from '@/api/errors'
import type { Graduation } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { Button, buttonClass } from '@/components/Button'
import { Dialog, DialogActions } from '@/components/Dialog'
import { FilterBar, FilterField, filterControl } from '@/components/Filters'
import { PageHeader, Panel } from '@/components/Page'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { TextField } from '@/components/TextField'
import { terbilangRupiah } from '@/lib/terbilang'
import { formatRupiah } from '@/lib/money'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { parseOption } from '@/features/audit/labels'
import { CLASSES, GROUPS } from '@/features/directory/labels'
import { useMajors } from '@/features/directory/queries'
import { runErrorMessage, scopeLabel } from './graduation'
import { useGraduationPreview, useRefreshSchoolYear } from './queries'

const CONFIRM_WORD = 'LULUS'

/**
 * Kelulusan. Step 1: pick the class (major and group optional). Step 2: the preview
 * lists every open account with what it will be paid (the full balance). Step 3: a
 * strong confirmation runs it: every account is paid out of the main vault and
 * closed, all or nothing. Then the result page prints the slips.
 */
export function GraduationPage() {
  const navigate = useNavigate()
  const { get, update } = useUrlFilters<'class' | 'major' | 'group'>()
  const majors = useMajors()
  const refresh = useRefreshSchoolYear()
  const klass = parseOption(CLASSES, get('class')) ?? 'XII'
  const majorId = get('major')
  const group = parseOption(GROUPS, get('group'))

  const scope = useMemo(() => ({ class: klass, major_id: majorId ? Number(majorId) : undefined, group }), [klass, majorId, group])
  const preview = useGraduationPreview(scope)
  const rows = useMemo(() => preview.data?.data ?? [], [preview.data])
  const summary = preview.data?.summary

  const major = majorId ? (majors.data?.find((m) => String(m.id) === majorId)?.code ?? null) : null
  const label = scopeLabel(klass, major, group ?? null)

  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [note, setNote] = useState('')

  const run = useMutation<Graduation, ApiError>({
    mutationFn: async () =>
      (
        await executeGraduation({
          ...scope,
          customer_ids: rows.map((r) => r.id),
          ...(note.trim() ? { note: note.trim() } : {}),
        })
      ).data,
    onSuccess: async (graduation) => {
      await refresh()
      void navigate(`/graduations/${graduation.id}`, { state: { justRan: true } })
    },
  })
  const failure = run.error ? runErrorMessage(run.error) : null

  function closeDialog() {
    if (run.isPending) return
    setConfirming(false)
    setTyped('')
  }

  function reload() {
    run.reset()
    setConfirming(false)
    setTyped('')
    void preview.refetch()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kelulusan"
        description="Bayarkan seluruh saldo siswa yang lulus dari brankas, lalu tutup rekeningnya. Tidak dapat dibatalkan."
        actions={
          <Link to="/graduations" className={buttonClass('secondary')}>
            Riwayat kelulusan
          </Link>
        }
      />

      <Alert tone="info" title="Cara kerja">
        <ol className="list-decimal space-y-0.5 pl-5">
          <li>Pilih kelas yang lulus, lalu periksa daftar rekening dan jumlah yang dibayarkan.</li>
          <li>
            Setiap rekening dibayar <strong>penuh</strong> (saldo minimum tidak berlaku lagi), uangnya dari brankas, lalu
            rekening ditutup.
          </li>
          <li>Setelah selesai, cetak bukti pembayaran untuk ditandatangani siswa.</li>
        </ol>
      </Alert>

      <Panel className="overflow-hidden">
        <FilterBar>
          <FilterField id="grad-class" label="Kelas">
            <select id="grad-class" value={klass} onChange={(e) => update({ class: e.target.value })} className={filterControl}>
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="grad-major" label="Jurusan">
            <select id="grad-major" value={majorId} onChange={(e) => update({ major: e.target.value })} className={filterControl}>
              <option value="">Semua jurusan</option>
              {majors.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} · {m.major_name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="grad-group" label="Rombel">
            <select id="grad-group" value={group ?? ''} onChange={(e) => update({ group: e.target.value })} className={filterControl}>
              <option value="">Semua</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </FilterField>
        </FilterBar>

        {preview.isPending ? (
          <SkeletonRows />
        ) : preview.error ? (
          <div className="p-4">
            <LoadError error={preview.error} onRetry={() => void preview.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={`Tidak ada rekening terbuka di ${label}`}>
            Rekening yang sudah diluluskan tidak muncul lagi. Lihat riwayat kelulusan untuk bukti pembayarannya.
          </EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                  Nama
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">
                  NIS
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">
                  Kelas
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
                  Status
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  Dibayarkan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-60 py-2.5 pr-3 pl-4">
                    <span className="block truncate text-ink-900">{r.full_name}</span>
                    <span className="font-mono text-xs text-ink-500">{r.account_number}</span>
                  </td>
                  <td className="hidden py-2.5 pr-3 font-mono text-[13px] text-ink-700 sm:table-cell">{r.nis}</td>
                  <td className="hidden py-2.5 pr-3 text-ink-700 md:table-cell">
                    {r.class} {r.major_name} {r.group}
                  </td>
                  <td className="hidden py-2.5 pr-3 lg:table-cell">
                    <Badge tone={r.account_status === 'active' ? 'success' : 'warning'}>
                      {r.account_status === 'active' ? 'Aktif' : 'Ditangguhkan'}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <Amount value={r.payout} size="sm" tone={r.payout > 0 ? 'default' : 'muted'} />
                    {r.payout === 0 && <span className="block text-xs text-ink-500">hanya ditutup</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {summary && rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-ink-900">{summary.customer_count}</span> rekening ditutup ·{' '}
            <span className="font-semibold text-ink-900">{summary.paid_count}</span> dibayar · total{' '}
            <span className="font-semibold text-ink-900">{formatRupiah(summary.total_amount)}</span>
          </p>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Luluskan {summary.customer_count} siswa
          </Button>
        </div>
      )}

      <Dialog
        open={confirming && summary !== undefined}
        onClose={closeDialog}
        dismissable={!run.isPending}
        size="sm"
        title={`Luluskan ${summary?.customer_count ?? 0} siswa ${label}?`}
        description="Semua rekening akan dibayar penuh dan ditutup. Tidak dapat dibatalkan."
      >
        {summary && (
          <div className="rounded-lg bg-ink-50 px-4 py-3 text-center">
            <p className="text-[13px] text-ink-500">Total dibayarkan dari brankas</p>
            <Amount value={summary.total_amount} size="xl" />
            <p className="mt-1 text-[13px] text-ink-600 first-letter:uppercase">{terbilangRupiah(summary.total_amount)}</p>
            <p className="mt-1 text-xs text-ink-500">
              {summary.paid_count} siswa menerima uang · {summary.customer_count - summary.paid_count} hanya ditutup
            </p>
          </div>
        )}
        <Alert tone="warning">
          Nasabah tidak dapat masuk ke aplikasi lagi, sesi dan permintaan yang terbuka dibatalkan, dan rekening tidak dapat
          bertransaksi.
        </Alert>
        <TextField
          label="Catatan (opsional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={255}
          disabled={run.isPending}
          hint="Misalnya: Kelulusan angkatan 2026."
        />
        <TextField
          label={`Ketik ${CONFIRM_WORD} untuk konfirmasi`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          data-autofocus
          disabled={run.isPending}
          inputClassName="font-mono uppercase"
        />
        {failure && (
          <Alert
            title="Kelulusan tidak dijalankan"
            action={
              failure.reload && (
                <Button variant="secondary" size="sm" onClick={reload}>
                  Muat ulang pratinjau
                </Button>
              )
            }
          >
            {failure.message} Tidak ada uang yang keluar dan tidak ada rekening yang ditutup.
          </Alert>
        )}
        <DialogActions>
          <Button variant="secondary" disabled={run.isPending} onClick={closeDialog}>
            Batal
          </Button>
          <Button
            variant="danger"
            loading={run.isPending}
            disabled={typed.trim().toUpperCase() !== CONFIRM_WORD}
            onClick={() => run.mutate()}
          >
            Bayar dan tutup {summary?.customer_count ?? 0} rekening
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
