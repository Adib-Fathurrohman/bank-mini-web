import type { CashCount } from '@/api/types'
import { Panel, Section } from '@/components/Page'
import { formatRupiah } from '@/lib/money'

/** One cash count (opening or closing) as denomination × quantity rows with a double-ruled total. */
export function CountTable({ title, counts }: { title: string; counts: CashCount[] }) {
  return (
    <Section title={title}>
      <Panel className="px-4">
        {counts.length === 0 ? (
          <p className="py-4 text-sm text-ink-500">Tidak ada hitungan.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-ink-100">
              {counts.map((c) => (
                <tr key={c.denomination}>
                  <th scope="row" className="py-2 text-left font-normal text-ink-700">
                    {formatRupiah(c.denomination)}
                  </th>
                  <td className="py-2 text-right text-ink-500">× {c.quantity}</td>
                  <td className="py-2 text-right text-ink-900">{formatRupiah(c.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-ink-200 font-semibold">
                <th scope="row" colSpan={2} className="py-2.5 text-left">
                  Total
                </th>
                <td className="py-2.5 text-right">
                  <span className="border-b-[3px] border-double border-ink-300 pb-0.5">
                    {formatRupiah(counts.reduce((sum, c) => sum + c.subtotal, 0))}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </Panel>
    </Section>
  )
}
