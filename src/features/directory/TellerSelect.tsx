import { filterControl } from '@/components/Filters'
import { useTellers } from './queries'

/** Teller menu for filters; blocked tellers stay listed because their records remain. */
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
