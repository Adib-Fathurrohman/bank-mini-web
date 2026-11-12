import type { CashCount } from '@/api/types'
import { Panel } from '@/components/Page'
import { DENOMINATIONS, countsFromList, pieceCount, totalOfCounts } from '@/lib/denominations'
import { formatRupiah } from '@/lib/money'

/**
 * What the drawer should hold right now, note by note (opening count + notes received
 * - notes paid out). Shown only for shifts that track the drawer (backend v0.3.0).
 */
export function DrawerPanel({ drawer }: { drawer: CashCount[] }) {
  const counts = countsFromList(drawer)
  return (
    <Panel className="px-4 py-3 sm:px-5">
      <table className="w-full text-sm" aria-label="Isi laci per pecahan">
        <thead>
          <tr className="border-b border-ink-200 text-left text-xs text-ink-500">
            <th scope="col" className="py-1.5 pr-2 font-medium">
              Pecahan
            </th>
            <th scope="col" className="py-1.5 pr-2 text-right font-medium">
              Jumlah
            </th>
            <th scope="col" className="py-1.5 text-right font-medium">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {DENOMINATIONS.map((d) => {
            const quantity = counts[d] ?? 0
            return (
              <tr key={d} className={`border-b border-ink-100 last:border-ink-200 ${quantity === 0 ? 'text-ink-300' : 'text-ink-800'}`}>
                <th scope="row" className="py-1 pr-2 text-left font-medium">
                  {formatRupiah(d)}
                </th>
                <td className="py-1 pr-2 text-right">{quantity}</td>
                <td className="py-1 text-right">{formatRupiah(d * quantity)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-2.5 text-left font-semibold text-ink-900">
              Total
            </th>
            <td className="pt-2.5 pr-2 text-right text-xs text-ink-500">{pieceCount(counts)} lbr/kpg</td>
            <td className="pt-2.5 text-right font-semibold text-ink-900">{formatRupiah(totalOfCounts(counts))}</td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  )
}
