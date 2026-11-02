import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelWithdrawalAuthorization,
  completeWithdrawalAuthorization,
  createWithdrawalAuthorization,
  fetchOpenWithdrawalAuthorizations,
  fetchWithdrawalAuthorization,
  type RecordedTransaction,
} from '@/api/endpoints/teller'
import type { ApiError } from '@/api/errors'
import type { WithdrawalAuthorization, WithdrawalAuthorizationStatus } from '@/api/types'
import { tellerKeys, useRefreshTeller } from './queries'

// Mode A withdrawal (API.md "Withdrawal authorizations"): the teller creates a
// request, the customer approves it in the mobile app with their PIN, the
// teller polls and completes it. The PIN never touches this client.

export const POLL_INTERVAL_MS = 2000

export function isOpenAuthorization(status: WithdrawalAuthorizationStatus): boolean {
  return status === 'pending' || status === 'approved'
}

/** The deadline that applies now: the customer's (pending) or the teller's (approved). */
export function authorizationWindow(a: WithdrawalAuthorization): { start: string; deadline: string } | null {
  if (a.status === 'pending') return { start: a.created_at, deadline: a.expires_at }
  if (a.status === 'approved' && a.approved_at && a.approval_expires_at) {
    return { start: a.approved_at, deadline: a.approval_expires_at }
  }
  return null
}

/**
 * Milliseconds left until `deadline`, ticking locally but anchored to the
 * server clock (`server_time` received at `receivedAt`), so a wrong PC clock
 * does not distort the countdown. Null when there is no deadline.
 */
export function useCountdown(deadline: string | null, serverTime: string | null, receivedAt: number): number | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadline) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [deadline])

  if (!deadline || !serverTime) return null
  const offset = Date.parse(serverTime) - receivedAt
  return Math.max(0, Date.parse(deadline) - (now + offset))
}

/** State and actions of the counter's withdrawal request (one open request per teller). */
export function useWithdrawalAuthorization() {
  const queryClient = useQueryClient()
  const refresh = useRefreshTeller()
  const [id, setId] = useState<string | null>(null)
  const [recorded, setRecorded] = useState<RecordedTransaction | null>(null)

  // Resume the waiting screen after a reload or navigation: the request lives on the server.
  const open = useQuery({
    queryKey: tellerKeys.openAuthorization,
    queryFn: async () => (await fetchOpenWithdrawalAuthorizations()).data[0] ?? null,
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    if (id !== null || !open.data) return
    queryClient.setQueryData(tellerKeys.authorization(open.data.id), open.data)
    setId(open.data.id)
  }, [id, open.data, queryClient])

  const authorization = useQuery({
    queryKey: tellerKeys.authorization(id ?? ''),
    queryFn: async () => (await fetchWithdrawalAuthorization(id!)).data,
    enabled: id !== null,
    retry: false,
    // Keep polling while the request is open, and through connection errors.
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return query.state.status === 'error' || (status && isOpenAuthorization(status)) ? POLL_INTERVAL_MS : false
    },
    refetchIntervalInBackground: true,
  })

  const create = useMutation<WithdrawalAuthorization, ApiError, { account_number: string; amount: number }>({
    mutationFn: async (body) => (await createWithdrawalAuthorization(body)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(tellerKeys.authorization(data.id), data)
      setRecorded(null)
      setId(data.id)
    },
    // The refusal may be "you already have an open request" (or a lost
    // response for one that was created): look for it; if one exists, the
    // effect above resumes it on screen.
    onError: () => void open.refetch(),
  })

  const cancel = useMutation<WithdrawalAuthorization, ApiError>({
    mutationFn: async () => (await cancelWithdrawalAuthorization(id!)).data,
    onSuccess: (data) => queryClient.setQueryData(tellerKeys.authorization(data.id), data),
    onError: () => void authorization.refetch(),
  })

  const complete = useMutation<RecordedTransaction, ApiError>({
    mutationFn: () => completeWithdrawalAuthorization(id!),
    onSuccess: (result) => {
      setRecorded(result)
      void refresh()
    },
    // The status may have moved on (expired, cancelled by a shift close): show it.
    onError: () => void authorization.refetch(),
  })

  /** Back to the form (after a final status, or to start over). */
  function reset() {
    setId(null)
    setRecorded(null)
    create.reset()
    cancel.reset()
    complete.reset()
    queryClient.setQueryData(tellerKeys.openAuthorization, null)
  }

  return {
    id,
    current: authorization.data ?? null,
    receivedAt: authorization.dataUpdatedAt,
    pollError: authorization.error,
    recorded,
    create,
    cancel,
    complete,
    reset,
  }
}

export type WithdrawalFlow = ReturnType<typeof useWithdrawalAuthorization>
