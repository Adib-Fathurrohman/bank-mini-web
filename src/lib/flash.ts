import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { ApiError } from '@/api/errors'

/** A one-time success message carried to the next page in router state, e.g. after saving a form. */
export interface Flash {
  flash: string
}

function readFlash(state: unknown): string | null {
  return state && typeof state === 'object' && 'flash' in state && typeof state.flash === 'string' ? state.flash : null
}

/** Reads the message once and clears it from history, so a reload or Back does not show it again. */
export function useFlash(): string | null {
  const location = useLocation()
  const navigate = useNavigate()
  const [flash] = useState(() => readFlash(location.state))

  useEffect(() => {
    if (readFlash(location.state)) {
      void navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null })
    }
  }, [location, navigate])

  return flash
}

/** The first message for a form field when the server rejected the form (422). */
export function fieldError(error: ApiError | null, name: string): string | undefined {
  return error?.kind === 'validation' ? error.field(name) : undefined
}
