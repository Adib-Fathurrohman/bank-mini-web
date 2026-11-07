import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * List filters and the page number kept in the URL, so a filtered list can be
 * reloaded, shared and returned to with Back. Any filter change goes back to page 1.
 */
export function useUrlFilters<K extends string>() {
  const [params, setParams] = useSearchParams()

  const get = useCallback((key: K) => params.get(key) ?? '', [params])

  const update = useCallback(
    (next: Partial<Record<K | 'page', string>>) => {
      setParams((current) => {
        const updated = new URLSearchParams(current)
        for (const [key, value] of Object.entries(next) as [string, string | undefined][]) {
          if (value) updated.set(key, value)
          else updated.delete(key)
        }
        if (!('page' in next)) updated.delete('page')
        return updated
      })
    },
    [setParams],
  )

  const clear = useCallback(() => setParams({}), [setParams])
  const page = Number(params.get('page') ?? '1') || 1
  const setPage = useCallback((p: number) => update({ page: p > 1 ? String(p) : '' } as Partial<Record<K | 'page', string>>), [update])
  const filtered = [...params.keys()].some((key) => key !== 'page')

  return { get, update, clear, page, setPage, filtered }
}
