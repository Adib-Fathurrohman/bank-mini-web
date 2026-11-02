import type { ReactNode } from 'react'

/** Key–value rows split by hairlines: label left, value right (receipts, reviews). */
export function DataList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <dl className={`divide-y divide-ink-200 ${className}`}>{children}</dl>
}

export function DataRow({
  label,
  children,
  mono = false,
  strong = false,
}: {
  label: ReactNode
  children: ReactNode
  mono?: boolean
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[13px] text-ink-500">{label}</dt>
      <dd
        className={`min-w-0 text-right break-words ${mono ? 'font-mono text-[13px]' : 'text-sm'} ${
          strong ? 'font-semibold text-ink-900' : 'text-ink-800'
        }`}
      >
        {children}
      </dd>
    </div>
  )
}
