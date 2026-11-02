import { useRef, type KeyboardEvent } from 'react'
import {
  DENOMINATIONS,
  MAX_DENOMINATION_QUANTITY,
  totalOfCounts,
  type Denomination,
  type DenominationCounts,
} from '@/lib/denominations'
import { Amount } from '@/components/Amount'
import { formatRupiah } from '@/lib/money'

const grouping = new Intl.NumberFormat('id-ID')

/**
 * Cash count per denomination (100.000 … 100), built for fast keyboard entry:
 * Enter or ↓ moves to the next row, ↑ to the previous one; Enter on the last
 * row submits the surrounding form.
 */
export function DenominationCounter({
  counts,
  onChange,
  disabled,
}: {
  counts: DenominationCounts
  onChange: (counts: DenominationCounts) => void
  disabled?: boolean
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  function setQuantity(denomination: Denomination, raw: string) {
    const digits = raw.replace(/\D/g, '')
    const quantity = digits === '' ? 0 : Math.min(Number.parseInt(digits, 10), MAX_DENOMINATION_QUANTITY)
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

  const pieces = DENOMINATIONS.reduce((sum, d) => sum + (counts[d] ?? 0), 0)

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-ink-200 text-left text-xs text-ink-500">
          <th scope="col" className="py-2 pr-2 font-medium">
            Pecahan
          </th>
          <th scope="col" className="py-2 pr-2 text-right font-medium">
            Jumlah
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Subtotal
          </th>
        </tr>
      </thead>
      <tbody>
        {DENOMINATIONS.map((d, index) => {
          const quantity = counts[d] ?? 0
          return (
            <tr key={d} className="border-b border-ink-100 last:border-ink-200">
              <th scope="row" className="py-1 pr-2 text-left font-medium text-ink-800">
                {formatRupiah(d)}
                <span className="ml-1.5 text-xs font-normal text-ink-400">{d >= 1000 ? 'lembar' : 'keping'}</span>
              </th>
              <td className="py-1 pr-2 text-right">
                <input
                  ref={(el) => {
                    inputs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label={`Jumlah pecahan ${formatRupiah(d)}`}
                  disabled={disabled}
                  value={quantity === 0 ? '' : String(quantity)}
                  placeholder="0"
                  onChange={(e) => setQuantity(d, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={(e) => e.target.select()}
                  className="h-8 w-20 rounded-md border border-ink-300 bg-white px-2 text-right font-medium text-ink-900 placeholder:text-ink-300 hover:border-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-100 focus-visible:outline-none disabled:bg-ink-100 sm:w-24"
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
          <th scope="row" className="pt-3 text-left text-sm font-semibold text-ink-900">
            Total
          </th>
          <td className="pt-3 pr-2 text-right text-xs text-ink-500">{grouping.format(pieces)} lbr/kpg</td>
          <td className="pt-3 text-right">
            <span className="inline-block border-b-[3px] border-double border-ink-300 pb-0.5">
              <Amount value={totalOfCounts(counts)} size="sm" />
            </span>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}
