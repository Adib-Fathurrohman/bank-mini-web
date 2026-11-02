import { api, requestBlob } from '../client'
import type {
  CashTransfer,
  DailyReport,
  DailyReportStatus,
  Paginated,
  Single,
  Staff,
  Transaction,
  TrialBalance,
} from '../types'

// Supervisor endpoints (API.md "Supervisor: daily reports", "Supervisor: vault
// ledger") plus the shared staff and audit reads the supervisor pages need.

export interface ReportFilters {
  status?: DailyReportStatus
  date?: string
  teller_id?: number
  page?: number
  per_page?: number
}

/** Newest date first; open shifts carry live totals. */
export function fetchReports(filters: ReportFilters) {
  return api.get<Paginated<DailyReport>>('/supervisor/daily-reports', { query: { ...filters } })
}

/** One report with counts, cash transfer and the transactions it summarizes (oldest first). */
export function fetchReport(id: number) {
  return api.get<Single<DailyReport> & { transactions: Transaction[] }>(`/supervisor/daily-reports/${id}`)
}

export function fetchReportPdf(id: number) {
  return requestBlob(`/supervisor/daily-reports/${id}/export`)
}

export type ReviewDecision = 'approve' | 'hold' | 'reject'

/**
 * Approve (final; books the counted cash into the vault), hold or reject (the
 * shift reopens for the teller). Hold and reject require a note.
 */
export function reviewReport(id: number, decision: ReviewDecision, note: string) {
  return api.post<Single<DailyReport>>(`/supervisor/daily-reports/${id}/${decision}`, note ? { note } : {})
}

export interface TransferFilters {
  from?: string
  to?: string
  teller_id?: number
  page?: number
}

export function fetchCashTransfers(filters: TransferFilters) {
  return api.get<Paginated<CashTransfer> & { total_amount: number }>('/supervisor/cash-transfers', {
    query: { ...filters },
  })
}

/** Tellers for filter menus, including blocked ones (their old reports stay). */
export function fetchTellers() {
  return api.get<Paginated<Staff>>('/staff', { query: { role: 'teller', status: 'all', per_page: 100 } })
}

export function fetchTrialBalance(params: { from?: string; to?: string }) {
  return api.get<Single<TrialBalance>>('/audit/journals/summary', { query: params })
}
