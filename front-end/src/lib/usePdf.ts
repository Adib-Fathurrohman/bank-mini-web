import { useCallback, useState } from 'react'
import { isApiError, networkError, type ApiError } from '@/api/errors'
import { openPdf } from './download'

/** Fetches an authenticated PDF and opens it; tracks which one is loading and the last error. */
export function usePdf() {
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [error, setError] = useState<ApiError | null>(null)

  const open = useCallback(async (key: string, fetchPdf: () => Promise<Blob>, filename: string) => {
    setPendingKey(key)
    setError(null)
    try {
      openPdf(await fetchPdf(), filename)
    } catch (caught) {
      setError(isApiError(caught) ? caught : networkError(caught))
    } finally {
      setPendingKey(null)
    }
  }, [])

  return { open, pendingKey, error, clearError: () => setError(null) }
}
