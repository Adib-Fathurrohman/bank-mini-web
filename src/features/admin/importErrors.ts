import { translateFieldMessage, type FieldErrors } from '@/api/errors'

const STAFF_LABELS: Record<string, string> = {
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

/** Column names for the customer import (`rows.*`) and its transaction history (`transactions.*`). */
export const CUSTOMER_LABELS: Record<string, string> = {
  nis: 'NIS',
  full_name: 'Nama',
  email: 'Email',
  class: 'Kelas',
  major: 'Jurusan',
  group: 'Rombel',
  balance: 'Saldo',
  account_number: 'No. rekening',
}

export const TRANSACTION_LABELS: Record<string, string> = {
  nis: 'NIS',
  date: 'Tanggal',
  type: 'Jenis',
  amount: 'Nominal',
  note: 'Keterangan',
}

/**
 * The backend names the cell in its messages ("nis (baris 5)", "(transaksi baris 3)");
 * the row is shown separately, so drop those parts.
 */
function clean(message: string): string {
  return translateFieldMessage(
    message
      .replace(/^(?!The )\w+ \((?:transaksi )?baris \d+\) (?=[a-z])/, '')
      .replace(/ \((?:transaksi )?baris \d+\)/g, ''),
  )
}

function group(errors: FieldErrors, prefix: string, labels: Record<string, string>): RowError[] {
  const byRow = new Map<number, string[]>()
  const pattern = new RegExp(`^${prefix}\\.(\\d+)\\.(\\w+)$`)
  for (const [key, messages] of Object.entries(errors)) {
    const match = key.match(pattern)
    if (!match) continue
    const row = Number(match[1]) + 2
    const label = labels[match[2]!] ?? match[2]!
    byRow.set(row, [...(byRow.get(row) ?? []), ...messages.map((m) => `${label}: ${clean(m)}`)])
  }
  return [...byRow.entries()].sort(([a], [b]) => a - b).map(([row, messages]) => ({ row, messages }))
}

function others(errors: FieldErrors, prefixes: string[]): string[] {
  return Object.entries(errors)
    .filter(([key]) => !prefixes.some((p) => new RegExp(`^${p}\\.\\d+\\.\\w+$`).test(key)))
    .flatMap(([, messages]) => messages.map(clean))
}

/**
 * Staff import errors arrive keyed `rows.{index}.{field}` with index 0 = sheet row 2.
 * Groups them per spreadsheet row; anything else (the file itself) goes to `general`.
 */
export function groupImportErrors(errors: FieldErrors): { rows: RowError[]; general: string[] } {
  return { rows: group(errors, 'rows', STAFF_LABELS), general: others(errors, ['rows']) }
}

/**
 * Customer import errors: `rows.{i}.{field}` for the customer sheet and
 * `transactions.{i}.{field}` for the history sheet, both with index 0 = sheet row 2.
 */
export function groupCustomerImportErrors(errors: FieldErrors): {
  rows: RowError[]
  transactions: RowError[]
  general: string[]
} {
  return {
    rows: group(errors, 'rows', CUSTOMER_LABELS),
    transactions: group(errors, 'transactions', TRANSACTION_LABELS),
    general: others(errors, ['rows', 'transactions']),
  }
}
