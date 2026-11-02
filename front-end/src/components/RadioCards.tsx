import type { ReactNode } from 'react'

export interface RadioCardOption<T extends string> {
  value: T
  label: string
  description?: ReactNode
}

/**
 * A choice between a few options with explanations. Native radio inputs, so
 * arrow keys move between options and the fieldset names the group.
 */
export function RadioCards<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  disabled = false,
  columns = 1,
}: {
  legend: string
  name: string
  value: T | null
  options: RadioCardOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  columns?: 1 | 2 | 3
}) {
  const grid = columns === 3 ? 'sm:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : ''
  return (
    <fieldset className="flex flex-col gap-1.5" disabled={disabled}>
      <legend className="mb-1.5 text-[13px] font-medium text-ink-700">{legend}</legend>
      <div className={`grid gap-2 ${grid}`}>
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-lg border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand-100 ${
                checked ? 'border-brand-600 bg-brand-50' : 'border-ink-200 bg-white hover:border-ink-300'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 size-4 shrink-0 accent-brand-600 focus-visible:outline-none"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink-900">{option.label}</span>
                {option.description && <span className="mt-0.5 block text-[13px] text-ink-600">{option.description}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
