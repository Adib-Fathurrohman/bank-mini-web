import { api, requestBlob } from '../client'
import type {
  AccountStatus,
  ActivationStatus,
  Customer,
  CustomerClass,
  CustomerGroup,
  Major,
  Paginated,
  Single,
  Staff,
  StaffRole,
} from '../types'

// Customer and staff reads shared by admin and supervisor (API.md "Customer
// accounts", "Staff management"). The admin's write endpoints come in Phase 4.

export interface CustomerFilters {
  /** Name, NIS or account number. */
  search?: string
  major_id?: number
  class?: CustomerClass
  group?: CustomerGroup
  status?: AccountStatus
  activation?: ActivationStatus
  /** `with` adds closed accounts, `only` shows only them. */
  trashed?: 'with' | 'only'
  page?: number
}

export function fetchCustomers(filters: CustomerFilters) {
  return api.get<Paginated<Customer>>('/customers', { query: { ...filters } })
}

/** Closed accounts can always be opened by id. */
export function fetchCustomer(id: number) {
  return api.get<Single<Customer>>(`/customers/${id}`)
}

export function fetchStatementPdf(id: number, range: { from?: string; to?: string }) {
  return requestBlob(`/customers/${id}/statement`, { query: range })
}

export function fetchMajors() {
  return api.get<{ data: Major[] }>('/majors')
}

export interface StaffFilters {
  search?: string
  role?: StaffRole
  /** `active` is the backend default. */
  status?: 'active' | 'inactive' | 'all'
  page?: number
  per_page?: number
}

export function fetchStaffList(filters: StaffFilters) {
  return api.get<Paginated<Staff>>('/staff', { query: { ...filters } })
}

export function fetchStaffMember(id: number) {
  return api.get<Single<Staff>>(`/staff/${id}`)
}
