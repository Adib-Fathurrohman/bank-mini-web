import { keepPreviousData, useQuery } from '@tanstack/react-query'
import * as directory from '@/api/endpoints/directory'
import { fetchMajors } from '@/api/endpoints/settings'
import type { CustomerFilters, StaffFilters } from '@/api/endpoints/directory'

export const directoryKeys = {
  customers: (filters: CustomerFilters) => ['directory', 'customers', filters] as const,
  customer: (id: number) => ['directory', 'customer', id] as const,
  majors: ['directory', 'majors'] as const,
  staff: (filters: StaffFilters) => ['directory', 'staff', filters] as const,
  staffMember: (id: number) => ['directory', 'staff-member', id] as const,
  tellers: ['directory', 'tellers'] as const,
}

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: directoryKeys.customers(filters),
    queryFn: () => directory.fetchCustomers(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCustomer(id: number, enabled = true) {
  return useQuery({
    queryKey: directoryKeys.customer(id),
    enabled,
    queryFn: async () => (await directory.fetchCustomer(id)).data,
  })
}

export function useMajors() {
  return useQuery({
    queryKey: directoryKeys.majors,
    queryFn: async () => (await fetchMajors()).data,
    staleTime: 30 * 60_000,
  })
}

export function useStaffList(filters: StaffFilters) {
  return useQuery({
    queryKey: directoryKeys.staff(filters),
    queryFn: () => directory.fetchStaffList(filters),
    placeholderData: keepPreviousData,
  })
}

export function useStaffMember(id: number, enabled = true) {
  return useQuery({
    queryKey: directoryKeys.staffMember(id),
    enabled,
    queryFn: async () => (await directory.fetchStaffMember(id)).data,
  })
}

/** Tellers for filter menus, including blocked ones (their old records stay). */
export function useTellers() {
  return useQuery({
    queryKey: directoryKeys.tellers,
    queryFn: async () => (await directory.fetchStaffList({ role: 'teller', status: 'all', per_page: 100 })).data,
    staleTime: 5 * 60_000,
  })
}
