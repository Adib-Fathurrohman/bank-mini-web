import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { controlClass, describedBy, FieldLabel, FieldMessage } from './TextField'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: ReactNode
  children: ReactNode
}

/** A labelled native select with the same error and hint layout as TextField. */
export function SelectField({ label, error, hint, id, className = '', children, ...rest }: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <FieldLabel htmlFor={selectId}>{label}</FieldLabel>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, error, hint)}
        className={`h-10 w-full px-3 text-sm ${controlClass(Boolean(error))}`}
        {...rest}
      >
        {children}
      </select>
      <FieldMessage id={selectId} error={error} hint={hint} />
    </div>
  )
}
