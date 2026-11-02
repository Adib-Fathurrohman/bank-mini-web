import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { deactivateCustomer } from '@/api/endpoints/admin'
import type { CustomerFilters } from '@/api/endpoints/directory'
import type { Customer } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { Button, buttonClass } from '@/components/Button'
import { Dialog, DialogActions } from '@/components/Dialog'
import { FilterBar, FilterField, filterControl } from '@/components/Filters'
import { PageHeader, Panel } from '@/components/Page'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { TextField } from '@/components/TextField'
import { formatRupiah } from '@/lib/money'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { parseOption } from '@/features/audit/labels'
import { ACCOUNT_STATUS_LABEL, ACCOUNT_STATUS_TONE, CLASSES, classLabel, GROUPS } from '@/features/directory/labels'
import { useMajors } from '@/features/directory/queries'
import { closeOneByOne, summarizeSelection, type GraduationOutcome } from './graduation'
import { useCohort, useRefreshDirectory } from './queries'

const CONFIRM_WORD = 'LULUS'

/** Pick a class, see every open account in it with its balance, and close the chosen ones. */
export function GraduationPage() {
  const { get, update } = useUrlFilters<'class' | 'major' | 'group'>()
  const majors = useMajors()
  const refresh = useRefreshDirectory()
  const klass = parseOption(CLASSES, get('class')) ?? 'XII'
  const majorId = get('major')
  const group = parseOption(GROUPS, get('group'))

  const filters = useMemo<CustomerFilters>(
    () => ({ class: klass, major_id: majorId ? Number(majorId) : undefined, group }),
    [klass, majorId, group],
  )
  const cohort = useCohort(filters, true)
  const rows = useMemo(() => cohort.data ?? [], [cohort.data])

  // Everyone starts selected; the admin unticks students who stay (repeat a year, still have business).
  const [unselected, setUnselected] = useState<Set<number>>(new Set())
  const selected = useMemo(() => new Set(rows.filter((r) => !unselected.has(r.id)).map((r) => r.id)), [rows, unselected])
  const summary = summarizeSelection(rows, selected)

  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [run, setRun] = useState<{ rows: Customer[]; results: Map<number, GraduationOutcome>; done: boolean } | null>(null)

  function toggle(id: number) {
    setUnselected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function start(targets: Customer[]) {
    setConfirming(false)
    setTyped('')
    const results = new Map<number, GraduationOutcome>()
    setRun({ rows: targets, results, done: false })
    await closeOneByOne(
      targets.map((t) => t.id),
      (id) => deactivateCustomer(id),
      (id, outcome) => {
        results.set(id, outcome)
        setRun({ rows: targets, results: new Map(results), done: false })
      },
    )
    setRun({ rows: targets, results: new Map(results), done: true })
    void refresh()
  }

  const label = `kelas ${klass}${majorId ? ` ${majors.data?.find((m) => String(m.id) === majorId)?.code ?? ''}` : ''}${group ? ` ${group}` : ''}`

  if (run) {
    const closed = run.rows.filter((r) => run.results.get(r.id)?.status === 'closed')
    const failed = run.rows.filter((r) => run.results.get(r.id)?.status === 'failed')
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <PageHeader title="Kelulusan" description={`Menutup rekening ${label}.`} />
        {!run.done ? (
          <Alert tone="info" title={`Menutup rekening… ${run.results.size} dari ${run.rows.length}`}>
            Jangan tutup halaman ini sampai selesai.
          </Alert>
        ) : failed.length === 0 ? (
          <Alert tone="success" title={`${closed.length} rekening ditutup`}>
            Rekening yang ditutup tetap dapat dilihat lewat filter status “Ditutup” di halaman Nasabah.
          </Alert>
        ) : (
          <Alert
            tone="warning"
            title={`${closed.length} ditutup, ${failed.length} gagal`}
            action={
              <Button variant="secondary" size="sm" onClick={() => void start(failed)}>
                Coba lagi yang gagal
              </Button>
            }
          >
            Rekening yang gagal tetap terbuka.
          </Alert>
        )}
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {run.rows.map((r) => {
              const outcome = run.results.get(r.id)
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ink-900">{r.full_name}</span>
                    <span className="font-mono text-xs text-ink-500">{r.account_number}</span>
                  </span>
                  {!outcome ? (
                    <span className="text-xs text-ink-500">Menunggu</span>
                  ) : outcome.status === 'closed' ? (
                    <Badge tone="success">Ditutup</Badge>
                  ) : (
                    <span className="text-right text-xs text-neg-700">{outcome.message}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </Panel>
        {run.done && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setRun(null)}>
              Kelas lain
            </Button>
            <Link to="/customers?status=closed" className={buttonClass('secondary')}>
              Lihat rekening ditutup
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kelulusan"
        description="Tutup rekening siswa yang lulus. Rekening dinonaktifkan dan disembunyikan; riwayatnya tetap tersimpan. Tidak dapat dibatalkan."
      />

      <Alert tone="warning" title="Tarik saldo di loket sebelum kelulusan">
        Saldo rekening yang ditutup tidak dapat ditarik lagi. Penarikan di loket tetap menyisakan saldo minimum.
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

        {cohort.isPending ? (
          <SkeletonRows />
        ) : cohort.error ? (
          <div className="p-4">
            <LoadError error={cohort.error} onRetry={() => void cohort.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={`Tidak ada rekening terbuka di ${label}`} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
                <th scope="col" className="w-10 py-2 pl-4">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua"
                    checked={selected.size === rows.length}
                    ref={(el) => {
                      if (el) el.indeterminate = selected.size > 0 && selected.size < rows.length
                    }}
                    onChange={() => setUnselected(selected.size === rows.length ? new Set(rows.map((r) => r.id)) : new Set())}
                    className="size-4 accent-brand-600"
                  />
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Nama
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">
                  Kelas
                </th>
                <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">
                  Status
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((r) => (
                <tr key={r.id} className={selected.has(r.id) ? '' : 'text-ink-400'}>
                  <td className="py-2.5 pl-4">
                    <input
                      type="checkbox"
                      aria-label={`Luluskan ${r.full_name}`}
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      className="size-4 accent-brand-600"
                    />
                  </td>
                  <td className="max-w-60 py-2.5 pr-3">
                    <span className={`block truncate ${selected.has(r.id) ? 'text-ink-900' : ''}`}>{r.full_name}</span>
                    <span className="font-mono text-xs text-ink-500">{r.account_number}</span>
                  </td>
                  <td className="hidden py-2.5 pr-3 md:table-cell">{classLabel(r)}</td>
                  <td className="hidden py-2.5 pr-3 sm:table-cell">
                    <Badge tone={ACCOUNT_STATUS_TONE[r.account_status]}>{ACCOUNT_STATUS_LABEL[r.account_status]}</Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <Amount value={r.balance} size="sm" tone={r.balance > 0 ? 'default' : 'muted'} />
                    {r.balance > 0 && selected.has(r.id) && <span className="block text-xs text-warn-700">masih ada saldo</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-ink-900">{summary.count}</span> dari {rows.length} rekening dipilih
            {summary.withBalance > 0 && (
              <>
                {' '}
                · <span className="text-warn-700">{summary.withBalance} masih bersaldo, total {formatRupiah(summary.remaining)}</span>
              </>
            )}
          </p>
          <Button variant="danger" disabled={summary.count === 0} onClick={() => setConfirming(true)}>
            Luluskan {summary.count} siswa
          </Button>
        </div>
      )}

      <Dialog
        open={confirming}
        onClose={() => {
          setConfirming(false)
          setTyped('')
        }}
        size="sm"
        title={`Luluskan ${summary.count} siswa ${label}?`}
        description="Setiap rekening yang dipilih ditutup: nasabah tidak dapat masuk ke aplikasi dan rekening tidak dapat bertransaksi. Tidak dapat dibatalkan."
      >
        {summary.withBalance > 0 && (
          <Alert tone="warning" title={`${summary.withBalance} rekening masih bersaldo`}>
            Total {formatRupiah(summary.remaining)} tidak dapat ditarik setelah rekening ditutup.
          </Alert>
        )}
        <TextField
          label={`Ketik ${CONFIRM_WORD} untuk konfirmasi`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          data-autofocus
          inputClassName="font-mono uppercase"
        />
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => {
              setConfirming(false)
              setTyped('')
            }}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={typed.trim().toUpperCase() !== CONFIRM_WORD}
            onClick={() => void start(rows.filter((r) => selected.has(r.id)))}
          >
            Tutup {summary.count} rekening
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
