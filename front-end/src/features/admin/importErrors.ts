import { translateFieldMessage, type FieldErrors } from '@/api/errors'

const FIELD_LABEL: Record<string, string> = {
  username: 'Username',
  full_name: 'Nama',
  password: 'Password',
  role: 'Peran',
  class: 'Kelas',
  phone: 'No. HP',
}

export interface RowError {
  /** Spreadsheet row as the user sees it (row 1 is the header). */
  row: number
  messages: string[]
}

/**
 * Import errors arrive keyed `rows.{index}.{field}` with index 0 = sheet row 2.
 * Groups them per spreadsheet row; anything else (the file itself) goes to `general`.
 */
export function groupImportErrors(errors: FieldErrors): { rows: RowError[]; general: string[] } {
  const byRow = new Map<number, string[]>()
  const general: string[] = []
  for (const [key, messages] of Object.entries(errors)) {
    const match = key.match(/^rows\.(\d+)\.(\w+)$/)
    if (!match) {
      general.push(...messages.map(translateFieldMessage))
      continue
    }
    const row = Number(match[1]) + 2
    const label = FIELD_LABEL[match[2]!] ?? match[2]!
    // Drop the backend's "(baris N)" from the English text; the row is shown separately.
    const texts = messages.map((m) => `${label}: ${translateFieldMessage(m.replace(/ \(baris \d+\)/, ''))}`)
    byRow.set(row, [...(byRow.get(row) ?? []), ...texts])
  }
  const rows = [...byRow.entries()].sort(([a], [b]) => a - b).map(([row, messages]) => ({ row, messages }))
  return { rows, general }
}
