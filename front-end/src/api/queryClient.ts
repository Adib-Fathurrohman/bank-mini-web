import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './errors'

// Only transient failures are worth retrying, and only for reads.
// Mutations are never retried automatically: money requests must be retried
// by the user with the same Idempotency-Key (docs/FRONTEND_AUDIT.md §5.5).
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
