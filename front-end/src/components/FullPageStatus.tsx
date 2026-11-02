import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'
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
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="flex max-w-md flex-col items-center gap-3 text-center" aria-live="polite">
        {busy ? <Spinner className="size-6 text-brand-700" /> : <BrandMark />}
        <h1 className="text-base font-semibold text-ink-900">{title}</h1>
        {description && <p className="text-sm text-ink-600">{description}</p>}
        {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
      </div>
    </main>
  )
}
