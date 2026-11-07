import { QueryClient } from '@tanstack/react-query'
import { isApiError, type ApiError } from './errors'

// Every request goes through api/client, which only throws ApiError.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}

// Only transient failures are worth retrying, and only for reads.
// Mutations are never retried automatically: money requests must be retried
// by the user with the same Idempotency-Key.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < 1 && isApiError(error) && (error.kind === 'network' || error.kind === 'server'),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
