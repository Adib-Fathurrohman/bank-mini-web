import type { ReactNode } from 'react'
import { isApiError } from '@/api/errors'
import { Alert } from './Alert'
import { Button } from './Button'
import { Spinner } from './Spinner'

export function Loading({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-ink-500" role="status">
      <Spinner className="size-4" />
      {label}
    </div>
  )
}

export function LoadError({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const offline = isApiError(error) && error.kind === 'network'
  return (
    <Alert
      title={offline ? 'Tidak terhubung ke server' : 'Data tidak dapat dimuat'}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry}>
            Coba lagi
          </Button>
        )
      }
    >
      {error.message}
    </Alert>
  )
}

/** Grey bars in place of content that is loading; keeps the layout's shape. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded bg-ink-100 ${className}`} />
}

/** A sentence and at most one action. No illustrations. */
export function EmptyState({
  title,
  children,
  action,
  className = '',
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center gap-1 px-6 py-12 text-center ${className}`}>
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {children && <div className="max-w-sm text-sm text-ink-500">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

/** Placeholder rows for a table or list that is loading. */
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Memuat" className="divide-y divide-ink-100">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="hidden h-4 w-40 sm:block" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      ))}
    </div>
  )
}
