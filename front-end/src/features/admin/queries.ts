import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { fetchCustomerCard } from '@/api/endpoints/admin'
import { fetchCustomers, fetchStaffList, type CustomerFilters, type StaffFilters } from '@/api/endpoints/directory'
import type { Customer } from '@/api/types'

export const adminKeys = {
  customerCount: (filters: CustomerFilters) => ['directory', 'count', 'customers', filters] as const,
  staffCount: (filters: StaffFilters) => ['directory', 'count', 'staff', filters] as const,
  card: (id: number) => ['directory', 'card', id] as const,
  cohort: (filters: CustomerFilters) => ['directory', 'cohort', filters] as const,
}

/** Dashboard figure: only `meta.total` of a one-row page. */
export function useCustomerCount(filters: CustomerFilters) {
  return useQuery({
    queryKey: adminKeys.customerCount(filters),
    queryFn: async () => (await fetchCustomers({ ...filters, per_page: 1 })).meta.total,
  })
}

export function useStaffCount(filters: StaffFilters) {
  return useQuery({
    queryKey: adminKeys.staffCount(filters),
    queryFn: async () => (await fetchStaffList({ ...filters, per_page: 1 })).meta.total,
  })
}

export function useCustomerCard(id: number) {
  return useQuery({
    queryKey: adminKeys.card(id),
    queryFn: async () => (await fetchCustomerCard(id)).data,
  })
}

/** Every open account of a class (all pages), for graduation. */
export function useCohort(filters: CustomerFilters, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.cohort(filters),
    enabled,
    queryFn: async () => {
      const rows: Customer[] = []
      for (let page = 1; ; page++) {
        const result = await fetchCustomers({ ...filters, page, per_page: 100 })
        rows.push(...result.data)
        if (page >= result.meta.last_page) return rows
      }
    },
  })
}

/** After any admin write: customer and staff lists, counts, details and cards may all have changed. */
export function useRefreshDirectory() {
  const queryClient = useQueryClient()
  return useCallback(() => queryClient.invalidateQueries({ queryKey: ['directory'] }), [queryClient])
}
