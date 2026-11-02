import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { parseRupiahInput } from '@/lib/money'
import { controlClass, describedBy, FieldLabel, FieldMessage } from './TextField'

const grouping = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'size'> {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  error?: string
  hint?: ReactNode
  /** `xl` is the counter's focal amount field. */
  size?: 'md' | 'xl'
  ref?: Ref<HTMLInputElement>
}

/** Rupiah amount input: digits only, shown with thousand separators, emitted as an integer. */
export function MoneyInput({
  label,
  value,
  onChange,
  error,
  hint,
  size = 'md',
  id,
  className = '',
  ref,
  ...rest
}: MoneyInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const xl = size === 'xl'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div className="relative">
        <span
          className={`pointer-events-none absolute inset-y-0 left-0 flex items-center font-medium text-ink-500 ${
            xl ? 'pl-4 text-xl' : 'pl-3 text-sm'
          }`}
        >
          Rp
        </span>
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          value={value === null ? '' : grouping.format(value)}
          onChange={(e) => {
            const parsed = parseRupiahInput(e.target.value)
            // Ignore input beyond what a safe integer can hold.
            if (parsed === null || Number.isSafeInteger(parsed)) onChange(parsed)
          }}
          className={`w-full font-semibold tracking-tight ${
            xl ? 'h-16 pr-4 pl-13 text-[32px]' : 'h-10 pr-3 pl-9 text-base'
          } ${controlClass(Boolean(error))}`}
          {...rest}
        />
      </div>
      <FieldMessage id={inputId} error={error} hint={hint} />
    </div>
  )
}
