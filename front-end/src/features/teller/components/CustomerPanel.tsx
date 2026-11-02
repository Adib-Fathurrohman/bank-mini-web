import type { CustomerSummary } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { Eyebrow, Panel } from '@/components/Page'
import { Skeleton } from '@/components/QueryStatus'
import { formatDateTime, formatTime, isInFuture } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { ACCOUNT_STATUS_LABEL, APP_STATE_LABEL, APP_STATE_TONE, APP_STATE_WITHDRAWAL_BLOCK, appState } from '../labels'

/**
 * T3: the customer found by the lookup. Only fields the lookup endpoint
 * returns: identity, account, balance, status, app activation and PIN.
 */
export function CustomerPanel({ customer, minBalance }: { customer: CustomerSummary; minBalance?: number }) {
  const locked = isInFuture(customer.pin_locked_until)
  const active = customer.account_status === 'active'
  const app = appState(customer)
  const maxWithdrawal = minBalance === undefined ? null : Math.max(0, customer.balance - minBalance)

  return (
    <Panel>
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[17px] leading-snug font-semibold text-ink-900">{customer.full_name}</h2>
          <p className="mt-0.5 font-mono text-[13px] text-ink-600">{customer.account_number}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={active ? 'success' : 'danger'}>{ACCOUNT_STATUS_LABEL[customer.account_status]}</Badge>
          {app !== 'ready' && <Badge tone={APP_STATE_TONE[app]}>{APP_STATE_LABEL[app]}</Badge>}
          {locked && <Badge tone="warning">PIN diblokir</Badge>}
        </div>
      </div>

      <div className="border-t border-ink-200 px-4 py-3 sm:px-5">
        <Eyebrow>Saldo</Eyebrow>
        <Amount value={customer.balance} size="lg" className="mt-0.5 block" />
        {maxWithdrawal !== null && active && app === 'ready' && (
          <p className="mt-0.5 text-[13px] text-ink-500">
            Dapat ditarik {formatRupiah(maxWithdrawal)} · saldo minimum {formatRupiah(minBalance!)}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-ink-200 px-4 py-3 text-sm sm:grid-cols-3 sm:px-5">
        <div>
          <dt className="text-xs text-ink-500">NIS</dt>
          <dd className="font-mono text-[13px] text-ink-900">{customer.nis}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">Kelas</dt>
          <dd className="text-ink-900">
            {customer.class} · {customer.group}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-xs text-ink-500">Jurusan</dt>
          <dd className="text-ink-900">{customer.major_name}</dd>
        </div>
      </dl>

      {(customer.account_status !== 'active' || locked || app !== 'ready') && (
        <div className="flex flex-col gap-2 border-t border-ink-200 px-4 py-3 sm:px-5">
          {customer.account_status === 'suspended' && (
            <Alert title="Rekening ditangguhkan">Setor dan tarik tunai tidak dapat dilakukan.</Alert>
          )}
          {customer.account_status === 'inactive' && (
            <Alert title="Rekening ditutup">Rekening ini tidak dapat bertransaksi.</Alert>
          )}
          {active && app !== 'ready' && (
            <Alert tone="info" title={app === 'pending' ? 'Aplikasi belum diaktivasi' : 'PIN belum dibuat'}>
              {APP_STATE_WITHDRAWAL_BLOCK[app]} Setor tunai tetap bisa.
            </Alert>
          )}
          {locked && customer.pin_locked_until && (
            <Alert tone="warning" title={`PIN diblokir sampai ${formatTime(customer.pin_locked_until)} WIB`}>
              Salah PIN 3 kali. Penarikan dapat diminta lagi setelah {formatDateTime(customer.pin_locked_until)}; setor
              tunai tetap bisa.
            </Alert>
          )}
        </div>
      )}
    </Panel>
  )
}

export function CustomerPanelSkeleton() {
  return (
    <Panel>
      <div role="status" aria-label="Mencari nasabah" className="flex flex-col gap-3 px-4 py-4 sm:px-5">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-28" />
        <div className="border-t border-ink-200 pt-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="mt-2 h-7 w-36" />
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-ink-200 pt-3">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </div>
    </Panel>
  )
}
