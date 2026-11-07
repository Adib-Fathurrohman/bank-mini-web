import { api, requestBlob } from '../client'
import type {
  AccountCode,
  AuditTransaction,
  Journal,
  JournalPosition,
  Paginated,
  Single,
  Transaction,
  TransactionType,
  TrialBalance,
} from '../types'

// Audit and report endpoints (API.md "Audit", "Reports and PDF exports").
// Admin and supervisor; read-only.

/** Shared audit filters. `from`/`to` are whole days (YYYY-MM-DD). */
export interface AuditFilters {
  from?: string
  to?: string
  /** Teller name or username, contains. */
  teller?: string
  /** Customer name, account number or NIS, contains. */
  customer?: string
  type?: TransactionType
  teller_id?: number
  customer_id?: number
}

export function fetchAuditTransactions(filters: AuditFilters & { page?: number; per_page?: number }) {
  return api.get<Paginated<Transaction>>('/audit/transactions', { query: { ...filters } })
}

/** One transaction with its journal lines and, for app-approved withdrawals, the authorization. */
export function fetchAuditTransaction(id: number) {
  return api.get<Single<AuditTransaction>>(`/audit/transactions/${id}`)
}

export function fetchAuditTransactionsPdf(filters: AuditFilters) {
  return requestBlob('/audit/transactions/export', { query: { ...filters } })
}

export interface JournalFilters extends AuditFilters {
  transaction_id?: number
  account_code?: AccountCode
  position?: JournalPosition
}

export function fetchJournals(filters: JournalFilters & { page?: number }) {
  return api.get<Paginated<Journal>>('/audit/journals', { query: { ...filters } })
}

/** Trial balance per account for the same filters. */
export function fetchTrialBalance(filters: JournalFilters) {
  return api.get<Single<TrialBalance>>('/audit/journals/summary', { query: { ...filters } })
}

export function fetchJournalsPdf(filters: JournalFilters) {
  return requestBlob('/audit/journals/export', { query: { ...filters } })
}

/** One school year, July–June; `schoolYear` 2026 means 2026/2027. */
export function fetchAnnualReportPdf(schoolYear: number) {
  return requestBlob('/reports/annual', { query: { school_year: schoolYear } })
}
