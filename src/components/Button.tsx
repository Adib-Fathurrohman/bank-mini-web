import type { ButtonHTMLAttributes, Ref } from 'react'
import { Icon, type IconName } from './Icon'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-ink-300 disabled:text-white',
  secondary:
    'border border-ink-300 bg-white text-ink-800 hover:border-ink-400 hover:bg-ink-50 active:bg-ink-100 disabled:text-ink-400',
  danger: 'bg-neg-700 text-white hover:bg-neg-800 disabled:bg-ink-300',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200 disabled:text-ink-400',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-[13px]',
  md: 'h-9 gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-5 text-[15px]',
}

/** Shared look for links styled as buttons (react-router `Link`). */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = ''): string {
  return `inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: IconName
  /** Shows a spinner and disables the button (e.g. while a request is pending). */
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : icon && <Icon name={icon} />}
      {children}
    </button>
  )
}

/** Square icon-only button; the label is its accessible name and tooltip. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  ...rest
}: Omit<ButtonProps, 'icon' | 'children' | 'size'> & { icon: IconName; label: string }) {
  return <Button icon={icon} variant={variant} size="sm" aria-label={label} title={label} className="w-8 px-0" {...rest} />
}
