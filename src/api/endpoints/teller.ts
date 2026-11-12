import { api, requestBlob, requestWithStatus } from '../client'
import type {
  CustomerSummary,
  DailyReport,
  Paginated,
  ShiftState,
  Single,
  Transaction,
  WithdrawalAuthorization,
} from '../types'

// Teller endpoints (API.md "Teller: ..." sections). All are scoped to the
// logged-in teller by the backend.

export function fetchShift() {
  return api.get<ShiftState>('/teller/shift')
}

export function openShift(body: { denominations: Record<string, number> }) {
  return api.post<Single<DailyReport>>('/teller/shift/open', body)
}

export function closeShift(body: { denominations: Record<string, number> }) {
  return api.post<Single<DailyReport>>('/teller/shift/close', body)
}

export function lookupCustomer(identifier: string) {
  return api.get<Single<CustomerSummary>>('/teller/customers/lookup', { query: { identifier } })
}

/** Result of a money request: `replayed` is true when the server returned an earlier, identical submission (200). */
export interface RecordedTransaction {
  transaction: Transaction
  replayed: boolean
}

async function recordMoney(path: string, body: unknown, idempotencyKey: string): Promise<RecordedTransaction> {
  const { status, body: response } = await requestWithStatus<Single<Transaction>>('POST', path, {
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return { transaction: response.data, replayed: status === 200 }
}

/** Notes and coins of one transaction: `{"20000": 1, "5000": 3}` (see `toNotesPayload`). */
export type NotesPayload = Record<string, number>

export function deposit(body: { account_number: string; amount: number; denominations?: NotesPayload }, idempotencyKey: string) {
  return recordMoney('/teller/deposits', body, idempotencyKey)
}

// Withdrawals (Mode A, API.md "Withdrawal authorizations"). The PIN-at-the-
// terminal endpoint (`POST /teller/withdrawals`, Mode B) is deliberately not
// used: the teller never handles the customer's PIN.

const AUTHORIZATIONS = '/teller/withdrawal-authorizations'

/** Ask the customer to approve a withdrawal in their app. Runs every pre-check; no money moves. */
export function createWithdrawalAuthorization(body: { account_number: string; amount: number }) {
  return api.post<Single<WithdrawalAuthorization>>(AUTHORIZATIONS, body)
}

/** Polling endpoint (every ~2 s); expiry is applied on read. */
export function fetchWithdrawalAuthorization(id: string) {
  return api.get<Single<WithdrawalAuthorization>>(`${AUTHORIZATIONS}/${encodeURIComponent(id)}`)
}

/** The teller's request still in progress (pending/approved), to resume after a reload. */
export function fetchOpenWithdrawalAuthorizations() {
  return api.get<Paginated<WithdrawalAuthorization>>(AUTHORIZATIONS, { query: { status: 'open' } })
}

export function cancelWithdrawalAuthorization(id: string) {
  return api.post<Single<WithdrawalAuthorization>>(`${AUTHORIZATIONS}/${encodeURIComponent(id)}/cancel`)
}

/**
 * Records the approved withdrawal. 201 the first time, 200 with the same transaction on retry.
 * `denominations`: the notes actually handed over (tracked shifts); omitted, the server picks them.
 */
export async function completeWithdrawalAuthorization(id: string, denominations?: NotesPayload): Promise<RecordedTransaction> {
  const { status, body } = await requestWithStatus<Single<Transaction>>(
    'POST',
    `${AUTHORIZATIONS}/${encodeURIComponent(id)}/complete`,
    denominations ? { body: { denominations } } : {},
  )
  return { transaction: body.data, replayed: status === 200 }
}

export function correctTransaction(
  id: number,
  body: { reason: string; supervisor_username: string; supervisor_password: string; denominations?: NotesPayload },
  idempotencyKey: string,
) {
  return recordMoney(`/teller/transactions/${id}/correct`, body, idempotencyKey)
}

/** Own transactions of one date (server's today when `date` is omitted), newest first. */
export function fetchTransactions(params: { date?: string; page?: number; per_page?: number }) {
  return api.get<Paginated<Transaction>>('/teller/transactions', { query: params })
}

export function fetchDailyReports(params: { page?: number; per_page?: number }) {
  return api.get<Paginated<DailyReport>>('/teller/daily-reports', { query: params })
}

export function fetchDailyReport(id: number) {
  return api.get<Single<DailyReport> & { transactions: Transaction[] }>(`/teller/daily-reports/${id}`)
}

export function fetchReceiptPdf(transactionId: number) {
  return requestBlob(`/teller/transactions/${transactionId}/receipt`)
}

export function fetchDailyReportPdf(reportId: number) {
  return requestBlob(`/teller/daily-reports/${reportId}/export`)
}
