import { useRef, type KeyboardEvent } from 'react'
import { Button } from '@/components/Button'
import {
  DENOMINATIONS,
  MAX_DENOMINATION_QUANTITY,
  matchesAmount,
  pieceCount,
  remainderOf,
  totalOfCounts,
  type Denomination,
  type DenominationCounts,
} from '@/lib/denominations'
import { formatRupiah } from '@/lib/money'

/**
 * The notes and coins of one transaction, per denomination, built for fast keyboard
 * entry (Enter or ↓ next row, ↑ previous row). Cash in ("Uang diterima") passes no
 * `limits`; cash out ("Uang dibayarkan") passes what the drawer holds, which caps each
 * row. `shortages` (from a 422) highlights the rows the server refused.
 */
export function NotesGrid({
  label,
  amount,
  counts,
  onChange,
  limits,
  shortages,
  onAutoFill,
  disabled,
}: {
  label: string
  amount: number
  counts: DenominationCounts
  onChange: (counts: DenominationCounts) => void
  /** What the drawer holds per denomination (cash out). */
  limits?: DenominationCounts
  shortages?: Record<string, { requested: number; available: number }> | null
  /** "Isi otomatis": the parent computes the largest notes the drawer allows. */
  onAutoFill?: () => void
  disabled?: boolean
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const total = totalOfCounts(counts)
  const remainder = remainderOf(amount, counts)
  const match = matchesAmount(amount, counts)

  function setQuantity(denomination: Denomination, raw: string) {
    const digits = raw.replace(/\D/g, '')
    let quantity = digits === '' ? 0 : Math.min(Number.parseInt(digits, 10), MAX_DENOMINATION_QUANTITY)
    if (limits) quantity = Math.min(quantity, limits[denomination] ?? 0)
    onChange({ ...counts, [denomination]: quantity })
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    const last = index === DENOMINATIONS.length - 1
    let target: number | null = null
    if (event.key === 'ArrowDown' || (event.key === 'Enter' && !last)) target = index + 1
    if (event.key === 'ArrowUp') target = index - 1
    if (target === null || target < 0 || target >= DENOMINATIONS.length) return
    event.preventDefault()
    inputs.current[target]?.focus()
  }

  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="flex w-full items-center justify-between gap-2 pb-1">
        <span className="text-[13px] font-medium text-ink-700">{label}</span>
        {onAutoFill && (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onAutoFill}>
            Isi otomatis
          </Button>
        )}
      </legend>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-left text-xs text-ink-500">
            <th scope="col" className="py-1.5 pr-2 font-medium">
              Pecahan
            </th>
            {limits && (
              <th scope="col" className="py-1.5 pr-2 text-right font-medium whitespace-nowrap">
                Di laci
              </th>
            )}
            <th scope="col" className="py-1.5 pr-2 text-right font-medium">
              Jumlah
            </th>
            <th scope="col" className="py-1.5 text-right font-medium">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {DENOMINATIONS.map((d, index) => {
            const quantity = counts[d] ?? 0
            const held = limits?.[d] ?? 0
            const short = shortages?.[String(d)]
            const unavailable = limits !== undefined && held === 0
            return (
              <tr
                key={d}
                className={`border-b border-ink-100 last:border-ink-200 ${short ? 'bg-neg-50' : ''}`}
                data-short={short ? 'true' : undefined}
              >
                <th scope="row" className="py-1 pr-2 text-left font-medium text-ink-800">
                  {formatRupiah(d)}
                  <span className="ml-1.5 text-xs font-normal text-ink-400">{d >= 1000 ? 'lembar' : 'keping'}</span>
                </th>
                {limits && (
                  <td className={`py-1 pr-2 text-right ${unavailable ? 'text-ink-300' : 'text-ink-600'}`}>
                    {held}
                    {short && (
                      <span className="sr-only">
                        , diminta {short.requested}, tersedia {short.available}
                      </span>
                    )}
                  </td>
                )}
                <td className="py-1 pr-2 text-right">
                  <input
                    ref={(el) => {
                      inputs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label={`${label}: jumlah pecahan ${formatRupiah(d)}`}
                    aria-invalid={short ? true : undefined}
                    disabled={disabled || unavailable}
                    value={quantity === 0 ? '' : String(quantity)}
                    placeholder="0"
                    onChange={(e) => setQuantity(d, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    className={`h-8 w-16 rounded-md border bg-white px-2 text-right font-medium text-ink-900 placeholder:text-ink-300 hover:border-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-100 focus-visible:outline-none disabled:bg-ink-100 sm:w-20 ${
                      short ? 'border-neg-600' : 'border-ink-300'
                    }`}
                  />
                </td>
                <td className={`py-1 text-right ${quantity ? 'text-ink-800' : 'text-ink-300'}`}>
                  {formatRupiah(d * quantity)}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-2.5 text-left text-sm font-semibold text-ink-900">
              Total
            </th>
            {limits && <td />}
            <td className="pt-2.5 pr-2 text-right text-xs text-ink-500">{pieceCount(counts)} lbr/kpg</td>
            <td className="pt-2.5 text-right font-semibold text-ink-900">{formatRupiah(total)}</td>
          </tr>
        </tfoot>
      </table>
      </div>
      <p
        aria-live="polite"
        className={`text-[13px] ${match ? 'text-pos-700' : total === 0 ? 'text-ink-500' : 'text-neg-700'}`}
      >
        {match
          ? `Pas ${formatRupiah(amount)}.`
          : total === 0
            ? `Isi pecahan sampai total ${formatRupiah(amount)}.`
            : remainder > 0
              ? `Kurang ${formatRupiah(remainder)} dari ${formatRupiah(amount)}.`
              : `Lebih ${formatRupiah(-remainder)} dari ${formatRupiah(amount)}.`}
      </p>
    </fieldset>
  )
}
