import type { ReactNode } from 'react'
import { Spinner } from './Spinner'

export function FullPageStatus({
  title,
  description,
  busy = false,
  children,
}: {
  title: string
  description?: string
  busy?: boolean
  children?: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex max-w-md flex-col items-center gap-3 text-center" aria-live="polite">
        {busy && <Spinner className="size-8 text-brand-700" />}
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-600">{description}</p>}
        {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
      </div>
    </main>
  )
}
