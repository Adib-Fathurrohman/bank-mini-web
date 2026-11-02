import type { ReactNode } from 'react'

export type BadgeTone = 'info' | 'warning' | 'success' | 'danger' | 'neutral'

const TONES: Record<BadgeTone, { box: string; dot: string }> = {
  info: { box: 'bg-brand-50 text-brand-800 ring-brand-200', dot: 'bg-brand-600' },
  warning: { box: 'bg-warn-50 text-warn-800 ring-warn-200', dot: 'bg-warn-500' },
  success: { box: 'bg-pos-50 text-pos-800 ring-pos-200', dot: 'bg-pos-600' },
  danger: { box: 'bg-neg-50 text-neg-800 ring-neg-200', dot: 'bg-neg-600' },
  neutral: { box: 'bg-ink-100 text-ink-700 ring-ink-200', dot: 'bg-ink-400' },
}

/** Compact status label: always text, the dot only reinforces it. */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const t = TONES[tone]
  return (
    <span
      className={`inline-flex h-5 items-center gap-1.5 rounded px-1.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${t.box}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${t.dot}`} />
      {children}
    </span>
  )
}
