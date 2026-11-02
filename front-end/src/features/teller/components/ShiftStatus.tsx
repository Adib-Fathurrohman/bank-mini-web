import { Link } from 'react-router'
import { Amount } from '@/components/Amount'
import { Badge } from '@/components/Badge'
import { buttonClass } from '@/components/Button'
import { Skeleton } from '@/components/QueryStatus'
import { formatShortDate } from '@/lib/datetime'
import { formatRupiah } from '@/lib/money'
import { GATE_LABEL, GATE_TONE } from '../labels'
import { useShift } from '../queries'

/** Sidebar block: the shift is the teller's working context, visible on every page. */
export function ShiftStatusBlock() {
  const { data: gate, isPending, error } = useShift()

  let body
  if (isPending) {
    body = (
      <>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-3 h-6 w-32" />
      </>
    )
  } else if (error) {
    body = <p className="text-[13px] text-neg-700">Status shift tidak dapat dimuat.</p>
  } else if (gate.kind === 'none' || gate.kind === 'closedToday') {
    body = (
      <>
        <Badge tone={GATE_TONE[gate.kind]}>{GATE_LABEL[gate.kind]}</Badge>
        <p className="mt-2 text-[13px] leading-snug text-ink-600">
          {gate.kind === 'none'
            ? 'Hitung kas laci untuk mulai melayani nasabah.'
            : 'Laporan menunggu verifikasi supervisor.'}
        </p>
        {gate.kind === 'none' && (
          <Link to="/teller" className={buttonClass('primary', 'sm', 'mt-3 w-full')}>
            Buka shift
          </Link>
        )}
      </>
    )
  } else {
    const { shift } = gate
    body = (
      <>
        <Badge tone={GATE_TONE[gate.kind]}>{GATE_LABEL[gate.kind]}</Badge>
        <p className="mt-1 text-xs text-ink-500">Shift {formatShortDate(shift.report_date)}</p>
        <p className="mt-3 text-2xs font-semibold tracking-[0.06em] text-ink-500 uppercase">Kas di laci (sistem)</p>
        <Amount value={shift.system_balance ?? 0} size="md" />
        <p className="text-xs text-ink-500">{shift.transaction_count} transaksi</p>
      </>
    )
  }

  return (
    <section aria-label="Status shift" className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5">
      {body}
    </section>
  )
}

/** Top-bar version for narrow screens. */
export function ShiftStatusPill() {
  const { data: gate } = useShift()
  if (!gate) return null
  const active = 'shift' in gate ? gate.shift : null
  return (
    <Link
      to="/teller"
      aria-label={`Status shift: ${GATE_LABEL[gate.kind]}`}
      className="flex h-8 max-w-full items-center gap-2 rounded-md border border-ink-200 px-2 text-xs text-ink-700 hover:bg-ink-50"
    >
      <Badge tone={GATE_TONE[gate.kind]}>{GATE_LABEL[gate.kind]}</Badge>
      {active && (
        <span className="hidden font-medium text-ink-900 sm:inline">{formatRupiah(active.system_balance ?? 0)}</span>
      )}
    </Link>
  )
}
