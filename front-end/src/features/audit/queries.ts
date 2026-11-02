import { keepPreviousData, useQuery } from '@tanstack/react-query'
import * as audit from '@/api/endpoints/audit'
import type { AuditFilters, JournalFilters } from '@/api/endpoints/audit'

export const auditKeys = {
  transactions: (filters: AuditFilters, page: number) => ['audit', 'transactions', filters, page] as const,
  transaction: (id: number) => ['audit', 'transaction', id] as const,
  journals: (filters: JournalFilters, page: number) => ['audit', 'journals', filters, page] as const,
  trialBalance: (filters: JournalFilters) => ['audit', 'trial-balance', filters] as const,
}

export function useAuditTransactions(filters: AuditFilters, page: number) {
  return useQuery({
    queryKey: auditKeys.transactions(filters, page),
    queryFn: () => audit.fetchAuditTransactions({ ...filters, page }),
    placeholderData: keepPreviousData,
  })
}

export function useAuditTransaction(id: number) {
  return useQuery({
    queryKey: auditKeys.transaction(id),
    queryFn: async () => (await audit.fetchAuditTransaction(id)).data,
  })
}

export function useJournals(filters: JournalFilters, page: number) {
  return useQuery({
    queryKey: auditKeys.journals(filters, page),
    queryFn: () => audit.fetchJournals({ ...filters, page }),
    placeholderData: keepPreviousData,
  })
}

export function useTrialBalance(filters: JournalFilters) {
  return useQuery({
    queryKey: auditKeys.trialBalance(filters),
    queryFn: async () => (await audit.fetchTrialBalance(filters)).data,
    placeholderData: keepPreviousData,
  })
}
