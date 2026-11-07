import type { Paginated } from '@/api/types'
import { Button } from './Button'

export function Pagination({ meta, onPage }: { meta: Paginated<unknown>['meta']; onPage: (page: number) => void }) {
  if (meta.last_page <= 1) return null
  return (
    <nav aria-label="Halaman" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-500">
      <span>
        {meta.from}–{meta.to} dari {meta.total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon="chevronLeft"
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
        >
          Sebelumnya
        </Button>
        <span className="px-1 text-ink-700">
          {meta.current_page} / {meta.last_page}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </nav>
  )
}
