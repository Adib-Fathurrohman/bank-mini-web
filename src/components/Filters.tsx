import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { controlClass } from './TextField'

/** A row of list filters that apply as soon as they change; wraps on narrow screens. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3 border-b border-ink-200 px-4 py-3">{children}</div>
}

export function FilterField({
  id,
  label,
  wide = false,
  children,
}: {
  id: string
  label: string
  /** For free-text search, which needs more room than a menu. */
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={`flex flex-1 flex-col gap-1 sm:flex-none ${wide ? 'min-w-56 sm:w-64' : 'min-w-36'}`}>
      <label htmlFor={id} className="text-xs font-medium text-ink-600">
        {label}
      </label>
      {children}
    </div>
  )
}

export const filterControl = `h-9 px-3 text-sm ${controlClass(false)}`

/**
 * Free-text filter that applies after typing pauses (or on Enter), so each
 * keystroke does not start a request.
 */
export function SearchFilter({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [text, setText] = useState(value)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  // Follow outside changes (e.g. "Hapus filter").
  useEffect(() => setText(value), [value])

  useEffect(() => {
    if (text.trim() === value) return
    const timer = setTimeout(() => onChangeRef.current(text.trim()), 400)
    return () => clearTimeout(timer)
  }, [text, value])

  return (
    <div className="relative">
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-400" />
      <input
        id={id}
        type="search"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onChange(text.trim())
        }}
        className={`${filterControl} w-full pl-8`}
      />
    </div>
  )
}
