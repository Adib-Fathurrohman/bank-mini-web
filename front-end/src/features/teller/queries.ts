import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import * as teller from '@/api/endpoints/teller'
import { fetchSettings } from '@/api/endpoints/settings'
import { shiftGate } from './shiftGate'

export const tellerKeys = {
  all: ['teller'] as const,
  shift: ['teller', 'shift'] as const,
  lookup: (identifier: string) => ['teller', 'lookup', identifier] as const,
  transactions: (date: string | undefined, page: number) => ['teller', 'transactions', date ?? 'today', page] as const,
  reports: (page: number) => ['teller', 'reports', page] as const,
  report: (id: number) => ['teller', 'report', id] as const,
  openAuthorization: ['teller', 'withdrawal-authorization', 'open'] as const,
  authorization: (id: string) => ['teller', 'withdrawal-authorization', id] as const,
}

export function useShift() {
  return useQuery({
    queryKey: tellerKeys.shift,
    queryFn: teller.fetchShift,
    select: shiftGate,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await fetchSettings()).data,
    staleTime: 5 * 60_000,
  })
}

export function useCustomerLookup(identifier: string) {
  return useQuery({
    queryKey: tellerKeys.lookup(identifier),
    queryFn: async () => (await teller.lookupCustomer(identifier)).data,
    enabled: identifier !== '',
    retry: false,
  })
}

export function useTransactions(date: string | undefined, page: number) {
  return useQuery({
    queryKey: tellerKeys.transactions(date, page),
    queryFn: () => teller.fetchTransactions({ date, page }),
    placeholderData: keepPreviousData,
  })
}

export function useDailyReports(page: number) {
  return useQuery({
    queryKey: tellerKeys.reports(page),
    queryFn: () => teller.fetchDailyReports({ page }),
    placeholderData: keepPreviousData,
  })
}

export function useDailyReport(id: number) {
  return useQuery({
    queryKey: tellerKeys.report(id),
    queryFn: () => teller.fetchDailyReport(id),
  })
}

/** After any teller write: shift totals, balances, lists and history may all have changed. */
export function useRefreshTeller() {
  const queryClient = useQueryClient()
  return useCallback(() => queryClient.invalidateQueries({ queryKey: tellerKeys.all }), [queryClient])
}
