import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { Icon } from './Icon'

/** Border + focus ring shared by every text-like control. */
export function controlClass(invalid: boolean): string {
  return `rounded-md border bg-white text-ink-900 transition-[border-color,box-shadow] placeholder:text-ink-400 focus-visible:outline-none disabled:bg-ink-100 disabled:text-ink-500 ${
    invalid
      ? 'border-neg-600 focus:ring-3 focus:ring-neg-100'
      : 'border-ink-300 hover:border-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-100'
  }`
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-700">
      {children}
    </label>
  )
}

/** Error (with icon) or hint under a field; ids match the input's aria-describedby. */
export function FieldMessage({ id, error, hint }: { id: string; error?: ReactNode; hint?: ReactNode }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="flex items-start gap-1.5 text-[13px] text-neg-700">
        <Icon name="alert" className="mt-0.5 size-3.5" />
        <span>{error}</span>
      </p>
    )
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-[13px] text-ink-500">
        {hint}
      </p>
    )
  }
  return null
}

export function describedBy(id: string, error?: unknown, hint?: unknown): string | undefined {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: ReactNode
  /** Shown inside the field on the left (e.g. a search icon). */
  leading?: ReactNode
  /** Shown inside the field on the right (e.g. a keyboard hint). */
  trailing?: ReactNode
  inputClassName?: string
  ref?: Ref<HTMLInputElement>
}

export function TextField({
  label,
  error,
  hint,
  leading,
  trailing,
  id,
  className = '',
  inputClassName = '',
  ref,
  ...rest
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={`h-10 w-full px-3 text-sm ${leading ? 'pl-9' : ''} ${trailing ? 'pr-12' : ''} ${controlClass(
            Boolean(error),
          )} ${inputClassName}`}
          {...rest}
        />
        {trailing && <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>}
      </div>
      <FieldMessage id={inputId} error={error} hint={hint} />
    </div>
  )
}
