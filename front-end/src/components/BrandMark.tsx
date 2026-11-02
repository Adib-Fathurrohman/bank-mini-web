/** The Bank Mini monogram: a navy tile with a ledger double-rule under "BM". */
export function BrandMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="32" height="32" rx="7" className="fill-brand-800" />
      <text
        x="16"
        y="18.5"
        textAnchor="middle"
        className="fill-white"
        style={{ font: '600 12px "IBM Plex Sans Variable", sans-serif', letterSpacing: '0.02em' }}
      >
        BM
      </text>
      <path d="M9 22.5h14M9 25h14" className="stroke-white/70" strokeWidth="1.2" />
    </svg>
  )
}

/** Mark + product name, used in the shell and on the login page. */
export function BrandLockup({ subtitle = 'E-Teller' }: { subtitle?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold text-ink-900">Bank Mini</span>
        <span className="text-xs text-ink-500">{subtitle}</span>
      </span>
    </span>
  )
}
