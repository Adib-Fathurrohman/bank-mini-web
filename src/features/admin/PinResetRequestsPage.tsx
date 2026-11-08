import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { approvePinReset, rejectPinReset, type PinResetFilters } from '@/api/endpoints/admin'
import type { ApiError } from '@/api/errors'
import type { PinResetRequest, PinResetStatus } from '@/api/types'
import { useCurrentUser } from '@/auth/context'
import { Alert } from '@/components/Alert'
import { Badge, type BadgeTone } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Dialog, DialogActions } from '@/components/Dialog'
import { FilterBar, FilterField, filterControl } from '@/components/Filters'
import { PageHeader, Panel } from '@/components/Page'
import { Pagination } from '@/components/Pagination'
import { EmptyState, LoadError, SkeletonRows } from '@/components/QueryStatus'
import { TextField } from '@/components/TextField'
import { parseOption } from '@/features/audit/labels'
import { formatDateTime } from '@/lib/datetime'
import { useUrlFilters } from '@/lib/useUrlFilters'
import { usePinResetRequests, useRefreshPinResets } from './queries'

const STATUSES: PinResetStatus[] = ['pending', 'approved', 'completed', 'rejected', 'cancelled', 'expired']
const STATUS_FILTERS = [...STATUSES, 'all'] as const

export const PIN_RESET_TONE: Record<PinResetStatus, BadgeTone> = {
  pending: 'warning',
  approved: 'info',
  completed: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
  expired: 'neutral',
}

const STATUS_OPTION_LABEL: Record<PinResetStatus, string> = {
  pending: 'Menunggu persetujuan',
  approved: 'Disetujui',
  completed: 'Selesai',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
}

/**
 * Forgotten-PIN requests from the customer app (backend v0.1.1). The student asks in
 * the app, the administrator checks the student card in person and approves; the new
 * PIN can be set 24 hours after the request. Withdrawals stay paused while a request
 * is open. Supervisors can read the list; only the administrator decides.
 */
export function PinResetRequestsPage() {
  const user = useCurrentUser()
  const { get, update, page, setPage } = useUrlFilters<'status'>()
  const statusParam = parseOption(STATUS_FILTERS, get('status'))
  // Default: what needs a decision.
  const status: PinResetStatus | undefined = statusParam === 'all' ? undefined : (statusParam ?? 'pending')

  const filters = useMemo<PinResetFilters>(() => ({ status, page }), [status, page])
  const list = usePinResetRequests(filters)
  const rows = list.data?.data ?? []
  const [deciding, setDeciding] = useState<{ request: PinResetRequest; action: 'approve' | 'reject' } | null>(null)
  const canDecide = user.role === 'admin'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reset PIN"
        description="Permintaan lupa PIN yang diajukan siswa dari aplikasi. Setujui hanya setelah siswa datang sendiri dengan kartu pelajar."
      />

      <Alert tone="info" title="Cara kerja">
        Setelah disetujui, siswa baru bisa membuat PIN baru 24 jam setelah permintaan diajukan. Selama permintaan terbuka,
        semua penarikan rekening itu ditunda. Untuk reset langsung di loket, gunakan &quot;Reset PIN&quot; di halaman nasabah.
      </Alert>

      <Panel className="overflow-hidden">
        <FilterBar>
          <FilterField id="pin-reset-status" label="Status">
            <select
              id="pin-reset-status"
              value={statusParam ?? 'pending'}
              onChange={(e) => update({ status: e.target.value === 'pending' ? '' : e.target.value })}
              className={filterControl}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_OPTION_LABEL[s]}
                </option>
              ))}
              <option value="all">Semua</option>
            </select>
          </FilterField>
        </FilterBar>

        {list.isPending ? (
          <SkeletonRows />
        ) : list.error ? (
          <div className="p-4">
            <LoadError error={list.error} onRetry={() => void list.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={status === 'pending' ? 'Tidak ada permintaan yang menunggu' : 'Tidak ada permintaan'}>
            {status === 'pending' ? 'Permintaan baru dari aplikasi muncul di sini.' : 'Ubah filter status.'}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-ink-100">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/customers/${r.customer.id}`} className="truncate text-sm font-medium text-ink-900 hover:underline">
                      {r.customer.full_name}
                    </Link>
                    <Badge tone={PIN_RESET_TONE[r.status]}>{r.status_label}</Badge>
                  </div>
                  <p className="font-mono text-xs text-ink-500">
                    {r.customer.account_number} · NIS {r.customer.nis} · {r.customer.class} {r.customer.major_name}{' '}
                    {r.customer.group}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-600">{describe(r)}</p>
                  {r.decision_note && <p className="text-[13px] text-ink-500">Catatan: {r.decision_note}</p>}
                </div>
                {canDecide && r.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" onClick={() => setDeciding({ request: r, action: 'reject' })}>
                      Tolak
                    </Button>
                    <Button onClick={() => setDeciding({ request: r, action: 'approve' })}>Setujui</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {list.data && <Pagination meta={list.data.meta} onPage={setPage} />}

      {deciding && (
        <DecisionDialog request={deciding.request} action={deciding.action} onClose={() => setDeciding(null)} />
      )}
    </div>
  )
}

/** One line of what happened and when (WIB). */
function describe(r: PinResetRequest): string {
  const asked = `Diajukan ${formatDateTime(r.requested_at)}`
  switch (r.status) {
    case 'pending':
      return `${asked}. Menunggu keputusan administrator.`
    case 'approved':
      return r.ready
        ? `${asked}. Disetujui${r.decided_by ? ` oleh ${r.decided_by}` : ''}; siswa sudah bisa membuat PIN baru.`
        : `${asked}. Disetujui${r.decided_by ? ` oleh ${r.decided_by}` : ''}; PIN baru bisa dibuat mulai ${r.available_at ? formatDateTime(r.available_at) : '-'}.`
    case 'completed':
      return `${asked}. PIN baru dibuat ${r.completed_at ? formatDateTime(r.completed_at) : ''}.`
    case 'rejected':
      return `${asked}. Ditolak${r.decided_by ? ` oleh ${r.decided_by}` : ''} ${r.rejected_at ? formatDateTime(r.rejected_at) : ''}.`
    case 'cancelled':
      return `${asked}. Dibatalkan siswa ${r.cancelled_at ? formatDateTime(r.cancelled_at) : ''}.`
    case 'expired':
      return `${asked}. Kedaluwarsa tanpa diselesaikan.`
  }
}

function DecisionDialog({
  request,
  action,
  onClose,
}: {
  request: PinResetRequest
  action: 'approve' | 'reject'
  onClose: () => void
}) {
  const refresh = useRefreshPinResets()
  const [note, setNote] = useState('')
  const mutation = useMutation<PinResetRequest, ApiError>({
    mutationFn: async () => {
      const trimmed = note.trim() || null
      return (await (action === 'approve' ? approvePinReset(request.id, trimmed) : rejectPinReset(request.id, trimmed))).data
    },
    onSettled: () => void refresh(),
  })
  const approve = action === 'approve'

  function close() {
    if (mutation.isPending) return
    onClose()
  }

  return (
    <Dialog
      open
      onClose={close}
      dismissable={!mutation.isPending}
      size="sm"
      title={mutation.isSuccess ? (approve ? 'Permintaan disetujui' : 'Permintaan ditolak') : approve ? 'Setujui reset PIN?' : 'Tolak reset PIN?'}
      description={
        mutation.isSuccess
          ? undefined
          : approve
            ? 'Pastikan siswa hadir sendiri dan kartu pelajarnya cocok dengan data di bawah. Siswa membuat PIN baru di aplikasi mulai 24 jam setelah permintaan diajukan.'
            : 'PIN lama tetap berlaku dan penarikan dibuka kembali. Siswa akan diberi tahu lewat aplikasi.'
      }
    >
      <DataList>
        <DataRow label="Nasabah">{request.customer.full_name}</DataRow>
        <DataRow label="NIS" mono>
          {request.customer.nis}
        </DataRow>
        <DataRow label="Rekening" mono>
          {request.customer.account_number}
        </DataRow>
        <DataRow label="Kelas">
          {request.customer.class} {request.customer.major_name} {request.customer.group}
        </DataRow>
        <DataRow label="Diajukan">{formatDateTime(request.requested_at)}</DataRow>
        {mutation.isSuccess && approve && mutation.data.available_at && (
          <DataRow label="PIN baru mulai">{formatDateTime(mutation.data.available_at)}</DataRow>
        )}
      </DataList>
      {!mutation.isSuccess && (
        <TextField
          label="Catatan (opsional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={255}
          hint={approve ? 'Misalnya: kartu pelajar diperiksa di loket.' : 'Alasan penolakan, terlihat oleh siswa.'}
          disabled={mutation.isPending}
        />
      )}
      {mutation.error && <Alert>{mutation.error.message}</Alert>}
      <DialogActions>
        {mutation.isSuccess ? (
          <Button onClick={close} data-autofocus>
            Selesai
          </Button>
        ) : (
          <>
            <Button variant="secondary" disabled={mutation.isPending} onClick={close}>
              Batal
            </Button>
            <Button variant={approve ? 'primary' : 'danger'} loading={mutation.isPending} onClick={() => mutation.mutate()}>
              {approve ? 'Setujui' : 'Tolak'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
