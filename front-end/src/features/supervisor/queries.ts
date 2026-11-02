import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as supervisor from '@/api/endpoints/supervisor'
import type { ReportFilters, ReviewDecision, TransferFilters } from '@/api/endpoints/supervisor'
import type { ApiError } from '@/api/errors'
import type { DailyReport, DailyReportStatus } from '@/api/types'

export const supervisorKeys = {
  all: ['supervisor'] as const,
  reports: (filters: ReportFilters) => ['supervisor', 'reports', filters] as const,
  report: (id: number) => ['supervisor', 'report', id] as const,
  transfers: (filters: TransferFilters) => ['supervisor', 'transfers', filters] as const,
}

export function useReports(filters: ReportFilters) {
  return useQuery({
    queryKey: supervisorKeys.reports(filters),
    queryFn: () => supervisor.fetchReports(filters),
    placeholderData: keepPreviousData,
  })
}

/** Dashboard counter: only `meta.total` is used. */
export function useReportCount(status: DailyReportStatus) {
  return useQuery({
    queryKey: supervisorKeys.reports({ status, per_page: 1 }),
    queryFn: async () => (await supervisor.fetchReports({ status, per_page: 1 })).meta.total,
  })
}

export function useReport(id: number) {
  return useQuery({
    queryKey: supervisorKeys.report(id),
    queryFn: () => supervisor.fetchReport(id),
  })
}

export function useCashTransfers(filters: TransferFilters) {
  return useQuery({
    queryKey: supervisorKeys.transfers(filters),
    queryFn: () => supervisor.fetchCashTransfers(filters),
    placeholderData: keepPreviousData,
  })
}

/** One decision on one report; refreshes every supervisor list, count and the vault afterwards. */
export function useReviewReport(id: number) {
  const queryClient = useQueryClient()
  return useMutation<DailyReport, ApiError, { decision: ReviewDecision; note: string }>({
    mutationFn: async ({ decision, note }) => (await supervisor.reviewReport(id, decision, note)).data,
    onSettled: () => queryClient.invalidateQueries({ queryKey: supervisorKeys.all }),
  })
}
