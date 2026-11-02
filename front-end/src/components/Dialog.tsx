import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

const WIDTHS = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

/**
 * Modal built on <dialog>: the browser handles focus trapping and the backdrop.
 * `dismissable={false}` (e.g. while a request is pending) ignores Escape and
 * hides the close button. Mark the element to focus on open with
 * `data-autofocus` (not `autoFocus`). On phones it opens as a bottom sheet.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  dismissable = true,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  size?: keyof typeof WIDTHS
  dismissable?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal() focuses the first focusable element; React's autoFocus ran
      // earlier while the dialog was hidden. Honour `data-autofocus` instead.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (dismissable) onClose()
      }}
      className={`max-h-[calc(100dvh-1rem)] w-full max-w-none overflow-y-auto rounded-t-xl bg-white p-0 text-ink-900 shadow-dialog max-sm:mx-0 max-sm:mt-auto max-sm:mb-0 sm:m-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-2rem)] sm:rounded-xl ${WIDTHS[size]}`}
    >
      {open && (
        <div className="flex flex-col">
          <div className="flex items-start gap-3 px-5 pt-5 pb-1 sm:px-6">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-base font-semibold text-ink-900">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
            </div>
            {dismissable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="-mt-1 -mr-2 rounded-md p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
              >
                <Icon name="x" className="size-4" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-4 px-5 pt-3 pb-5 sm:px-6 sm:pb-6">{children}</div>
        </div>
      )}
    </dialog>
  )
}

/** Footer row of a dialog: secondary actions left of the primary on wide screens, stacked on phones. */
export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 mt-1 flex flex-col-reverse gap-2 border-t border-ink-200 px-5 pt-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6 [&>*]:max-sm:w-full">
      {children}
    </div>
  )
}
