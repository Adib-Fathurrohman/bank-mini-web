import { api } from '../client'
import type {
  AccountStatus,
  Customer,
  CustomerCard,
  CustomerClass,
  CustomerGroup,
  MessageResponse,
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
