import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { fetchCustomerCard, fetchPinResetRequests, type PinResetFilters } from '@/api/endpoints/admin'
import {
  fetchClassPromotion,
  fetchClassPromotions,
  fetchGraduation,
  fetchGraduations,
  previewClassPromotion,
  previewGraduation,
  type GraduationScope,
} from '@/api/endpoints/graduation'
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

// Forgotten-PIN requests (backend v0.1.1).
export const pinResetKeys = {
  list: (filters: PinResetFilters) => ['pin-resets', 'list', filters] as const,
  pendingCount: ['pin-resets', 'pending-count'] as const,
  open: (customerId: number) => ['pin-resets', 'open', customerId] as const,
}

export function usePinResetRequests(filters: PinResetFilters) {
  return useQuery({
    queryKey: pinResetKeys.list(filters),
    queryFn: () => fetchPinResetRequests(filters),
    placeholderData: keepPreviousData,
  })
}

/** Requests waiting for the administrator (dashboard, menu). */
export function usePendingPinResetCount() {
  return useQuery({
    queryKey: pinResetKeys.pendingCount,
    queryFn: async () => (await fetchPinResetRequests({ status: 'pending', per_page: 1 })).meta.total,
    refetchInterval: 60_000,
  })
}

/** The customer's open request (pending or approved), if any, for the customer page. */
export function useOpenPinReset(customerId: number) {
  return useQuery({
    queryKey: pinResetKeys.open(customerId),
    queryFn: async () => {
      const { data } = await fetchPinResetRequests({ customer_id: customerId, per_page: 5 })
      return data.find((r) => r.status === 'pending' || r.status === 'approved') ?? null
    },
  })
}

export function useRefreshPinResets() {
  const queryClient = useQueryClient()
  return useCallback(() => queryClient.invalidateQueries({ queryKey: ['pin-resets'] }), [queryClient])
}

// Graduation (kelulusan) and class promotion (kenaikan kelas), backend v0.3.0.
export const schoolYearKeys = {
  graduationPreview: (scope: GraduationScope) => ['graduations', 'preview', scope] as const,
  graduations: (page: number) => ['graduations', 'list', page] as const,
  graduation: (id: string) => ['graduations', 'one', id] as const,
  promotionPreview: ['class-promotions', 'preview'] as const,
  promotions: (page: number) => ['class-promotions', 'list', page] as const,
  promotion: (id: string) => ['class-promotions', 'one', id] as const,
}

/** Always fresh: the run is refused (409) when the class changed since the preview. */
export function useGraduationPreview(scope: GraduationScope) {
  return useQuery({
    queryKey: schoolYearKeys.graduationPreview(scope),
    queryFn: () => previewGraduation(scope),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useGraduations(page: number) {
  return useQuery({
    queryKey: schoolYearKeys.graduations(page),
    queryFn: () => fetchGraduations(page),
    placeholderData: keepPreviousData,
  })
}

export function useGraduation(id: string) {
  return useQuery({
    queryKey: schoolYearKeys.graduation(id),
    queryFn: async () => (await fetchGraduation(id)).data,
  })
}

export function useClassPromotionPreview() {
  return useQuery({
    queryKey: schoolYearKeys.promotionPreview,
    queryFn: previewClassPromotion,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useClassPromotions(page: number) {
  return useQuery({
    queryKey: schoolYearKeys.promotions(page),
    queryFn: () => fetchClassPromotions(page),
    placeholderData: keepPreviousData,
  })
}

export function useClassPromotion(id: string) {
  return useQuery({
    queryKey: schoolYearKeys.promotion(id),
    queryFn: async () => (await fetchClassPromotion(id)).data,
  })
}

/** After a graduation or a promotion: accounts, classes, balances, previews and histories all changed. */
export function useRefreshSchoolYear() {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['directory'] }),
      queryClient.invalidateQueries({ queryKey: ['graduations'] }),
      queryClient.invalidateQueries({ queryKey: ['class-promotions'] }),
      queryClient.invalidateQueries({ queryKey: ['audit'] }),
    ])
  }, [queryClient])
}
