import type { AccountCode, JournalPosition, TransactionType } from '@/api/types'

// Labels as the backend prints them (TransactionTypes::label, AccountCode).

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  deposit: 'Setor tunai',
  withdrawal: 'Tarik tunai',
  deposit_correction: 'Koreksi setoran',
  withdrawal_correction: 'Koreksi penarikan',
}

export const TRANSACTION_TYPES = Object.keys(TRANSACTION_TYPE_LABEL) as TransactionType[]

export const ACCOUNT_LABEL: Record<AccountCode, string> = {
  '101': '101 · Kas',
  '201': '201 · Tabungan Nasabah',
}

export const POSITION_LABEL: Record<JournalPosition, string> = {
  debit: 'Debit',
  credit: 'Kredit',
}

export function parseOption<T extends string>(options: readonly T[], value: string): T | undefined {
  return options.find((option) => option === value)
}
