import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Tone = 'error' | 'warning' | 'info' | 'success'

const TONES: Record<Tone, { box: string; icon: string; name: IconName }> = {
  error: { box: 'border-neg-200 bg-neg-50 text-neg-800', icon: 'text-neg-700', name: 'xCircle' },
  warning: { box: 'border-warn-200 bg-warn-50 text-warn-800', icon: 'text-warn-700', name: 'alert' },
  info: { box: 'border-brand-200 bg-brand-50 text-brand-900', icon: 'text-brand-700', name: 'info' },
  success: { box: 'border-pos-200 bg-pos-50 text-pos-800', icon: 'text-pos-700', name: 'checkCircle' },
}

/** Inline notice placed next to what it is about (never a toast). */
export function Alert({
  tone = 'error',
  title,
  action,
  className = '',
  children,
}: {
  tone?: Tone
  title?: string
  /** A button or link shown at the end (right on wide screens). */
  action?: ReactNode
  className?: string
  children?: ReactNode
}) {
  const t = TONES[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex flex-wrap items-start gap-x-3 gap-y-2 rounded-md border px-3.5 py-3 text-sm ${t.box} ${className}`}
    >
      <Icon name={t.name} className={`mt-0.5 size-4 ${t.icon}`} />
      <div className="min-w-0 flex-1 basis-40">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 leading-relaxed' : 'leading-relaxed'}>{children}</div>}
      </div>
      {action && <div className="ml-7 flex shrink-0 gap-2 sm:ml-0">{action}</div>}
    </div>
  )
}
