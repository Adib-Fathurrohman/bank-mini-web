import type { ReactNode, Ref } from 'react'

/** Page title row: title (+ status) left, page-level actions right. */
export function PageHeader({
  title,
  meta,
  description,
  actions,
  back,
}: {
  title: ReactNode
  /** Small element next to the title, e.g. a status badge. */
  meta?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** A back link shown above the title. */
  back?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-1">
      {back}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink-900">{title}</h1>
          {meta}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {description && <p className="max-w-3xl text-sm text-ink-600">{description}</p>}
    </header>
  )
}

/** Titled block inside a page; separated by spacing and a rule, not a card. */
export function Section({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

/** The one bordered surface type: a work area (form, table, panel). */
export function Panel({
  children,
  className = '',
  ref,
}: {
  children: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <div ref={ref} className={`rounded-lg border border-ink-200 bg-white ${className}`}>
      {children}
    </div>
  )
}

/** Small uppercase label for groups inside a panel (e.g. "Rekening"). */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-2xs font-semibold tracking-[0.06em] text-ink-500 uppercase ${className}`}>{children}</p>
  )
}
