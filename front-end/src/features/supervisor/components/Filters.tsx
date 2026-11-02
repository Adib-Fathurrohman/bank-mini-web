import type { ReactNode } from 'react'
import { controlClass } from '@/components/TextField'
import { useTellers } from '../queries'

/** A row of list filters that apply as soon as they change; wraps on narrow screens. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3 border-b border-ink-200 px-4 py-3">{children}</div>
}

export function FilterField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-36 flex-1 flex-col gap-1 sm:flex-none">
      <label htmlFor={id} className="text-xs font-medium text-ink-600">
        {label}
      </label>
      {children}
    </div>
  )
}

export const filterControl = `h-9 px-3 text-sm ${controlClass(false)}`

/** Teller menu for filters; blocked tellers stay listed because their reports remain. */
export function TellerSelect({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const tellers = useTellers()
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={filterControl}>
      <option value="">{tellers.isPending ? 'Memuat…' : 'Semua teller'}</option>
      {tellers.data?.map((t) => (
        <option key={t.id} value={t.id}>
          {t.full_name}
          {t.is_active ? '' : ' (diblokir)'}
        </option>
      ))}
    </select>
  )
}
