import { api } from '../client'
import type {
  AccountStatus,
  Customer,
  CustomerCard,
  CustomerClass,
  CustomerGroup,
  MessageResponse,
  Paginated,
  PinResetRequest,
  PinResetStatus,
  QrScannerMode,
  Settings,
  Single,
  Staff,
  WithdrawalVerification,
} from '../types'

// Administrator writes (API.md "Staff management", "Customer accounts",
// "Settings"). Administrator accounts themselves cannot be changed (403).

export interface StaffInput {
  username: string
  full_name: string
  /** Required on create; on edit, empty keeps the current password. */
  password?: string
  role: 'teller' | 'supervisor'
  /** Optional; a new or changed address gets a verification link (valid 24 hours). */
  email?: string | null
  class?: string | null
  phone?: string | null
}

export function createStaff(body: StaffInput) {
  return api.post<Single<Staff>>('/admin/staff', body)
}

export function updateStaff(id: number, body: Partial<StaffInput>) {
  return api.patch<Single<Staff>>(`/admin/staff/${id}`, body)
}

/** Block keeps the account (history points at it) and revokes its sessions. */
export function setStaffBlocked(id: number, blocked: boolean) {
  return api.post<Single<Staff>>(`/admin/staff/${id}/${blocked ? 'block' : 'unblock'}`)
}

/** Only for accounts that were never used; 409 otherwise (block instead). */
export function deleteStaff(id: number) {
  return api.delete<MessageResponse>(`/admin/staff/${id}`)
}

export interface ImportedStaff extends Staff {
  /** Set only when the sheet had no password; shown once. */
  generated_password: string | null
}

/** All or nothing; row errors come back keyed `rows.{index}.{field}` (index 0 = sheet row 2). */
export function importStaff(file: File) {
  const body = new FormData()
  body.append('file', file)
  return api.post<Single<{ created: number; users: ImportedStaff[] }>>('/admin/staff/import', body, { timeoutMs: 60_000 })
}

export interface CustomerInput {
  nis: string
  full_name: string
  email: string
  class: CustomerClass
  major_id: number
  group: CustomerGroup
}

/** No PIN: the student creates it in the app after activating (sending one is refused). */
export interface CustomerImportResult {
  import_id: number
  customers_created: number
  transactions_created: number
  /** These stay pending until an email is added (edit the customer). */
  customers_without_email: number
  customers: Customer[]
}

/**
 * Existing savers from the old bookkeeping, with balance and optional history
 * (a "Transaksi" sheet in `file`, or `transactionsFile`). All or nothing; row
 * errors come back keyed `rows.{i}.{field}` / `transactions.{i}.{field}`
 * (index 0 = sheet row 2).
 */
export function importCustomers(file: File, transactionsFile: File | null) {
  const body = new FormData()
  body.append('file', file)
  if (transactionsFile) body.append('transactions_file', transactionsFile)
  return api.post<MessageResponse & Single<CustomerImportResult>>('/admin/customers/import', body, { timeoutMs: 120_000 })
}

export function openAccount(body: CustomerInput) {
  return api.post<Single<Customer>>('/admin/customers', body)
}

export type CustomerUpdate = Partial<CustomerInput> & {
  account_status?: Extract<AccountStatus, 'active' | 'suspended'>
}

export function updateCustomer(id: number, body: CustomerUpdate) {
  return api.patch<Single<Customer>>(`/admin/customers/${id}`, body)
}

/** Graduation: inactive, sessions and links revoked, soft deleted. Cannot be undone. */
export function deactivateCustomer(id: number) {
  return api.post<Single<Customer>>(`/admin/customers/${id}/deactivate`)
}

/** Forgotten PIN: removes it and any lock; the student creates a new one in the app. */
export function resetCustomerPin(id: number) {
  return api.post<MessageResponse & Single<Customer>>(`/admin/customers/${id}/pin-reset`)
}

export function fetchCustomerCard(id: number) {
  return api.get<Single<CustomerCard>>(`/admin/customers/${id}/card`)
}

export function updateSettings(body: Partial<{ min_balance: number; qr_scanner_mode: QrScannerMode; withdrawal_verification: WithdrawalVerification }>) {
  return api.patch<Single<Settings>>('/admin/settings', body)
}

// Forgotten PIN, self-service requests (backend v0.1.1). The student asks in the app;
// the administrator checks the student card in person and approves or rejects here.
// The list is readable by supervisors too; the decision is the administrator's.

export interface PinResetFilters {
  status?: PinResetStatus
  customer_id?: number
  page?: number
  per_page?: number
}

/** Newest first. Overdue requests are expired by the backend on read. */
export function fetchPinResetRequests(filters: PinResetFilters) {
  return api.get<Paginated<PinResetRequest>>('/pin-reset-requests', { query: { ...filters } })
}

/** Pending only (409 pin_reset_not_usable otherwise). The new PIN can be set 24 h after the request. */
export function approvePinReset(id: string, note: string | null) {
  return api.post<Single<PinResetRequest>>(`/admin/pin-reset-requests/${encodeURIComponent(id)}/approve`, note ? { note } : {})
}

export function rejectPinReset(id: string, note: string | null) {
  return api.post<Single<PinResetRequest>>(`/admin/pin-reset-requests/${encodeURIComponent(id)}/reject`, note ? { note } : {})
}
