const grouping = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

const SIZES = {
  sm: { number: 'text-sm font-semibold', currency: 'text-[0.8em]' },
  md: { number: 'text-lg font-semibold', currency: 'text-[0.7em]' },
  lg: { number: 'text-2xl font-semibold tracking-tight', currency: 'text-[0.6em]' },
  xl: { number: 'text-[34px] leading-10 font-semibold tracking-tight', currency: 'text-[0.55em]' },
}

const TONES = {
  default: 'text-ink-900',
  in: 'text-pos-700',
  muted: 'text-ink-500',
  danger: 'text-neg-700',
}

/**
 * A Rupiah figure with a smaller "Rp", so the number reads first.
 * `sign` prefixes + / − (money out stays ink-coloured; red only means an error).
 */
export function Amount({
  value,
  size = 'md',
  tone = 'default',
  sign = false,
  className = '',
}: {
  value: number
  size?: keyof typeof SIZES
  tone?: keyof typeof TONES
  sign?: boolean
  className?: string
}) {
  const s = SIZES[size]
  const prefix = sign ? (value > 0 ? '+' : value < 0 ? '−' : '') : value < 0 ? '−' : ''
  return (
    <span className={`whitespace-nowrap tabular-nums ${s.number} ${TONES[tone]} ${className}`}>
      {prefix}
      <span className={`mr-0.5 font-medium ${s.currency} ${tone === 'default' ? 'text-ink-500' : ''}`}>Rp</span>
      {grouping.format(Math.abs(value))}
    </span>
  )
}
