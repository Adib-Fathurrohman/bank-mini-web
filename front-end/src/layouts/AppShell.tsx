import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth, useCurrentUser } from '@/auth/context'
import { ROLE_HOME, ROLE_LABEL } from '@/auth/session'
import { BrandLockup } from '@/components/BrandMark'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { NAVIGATION } from './navigation'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

function SidebarContent({ status, onNavigate }: { status?: ReactNode; onNavigate?: () => void }) {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <BrandLockup />
      </div>

      {status && <div className="px-3 pt-2 pb-1">{status}</div>}

      <nav aria-label="Menu utama" className="flex flex-col gap-0.5 px-3 pt-3">
        {NAVIGATION[user.role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROLE_HOME[user.role]}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-brand-50 font-medium text-brand-800 before:absolute before:top-2 before:-left-3 before:h-5 before:w-[3px] before:rounded-r before:bg-brand-700'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.icon}
                  className={`size-4 ${isActive ? 'text-brand-700' : 'text-ink-400 group-hover:text-ink-600'}`}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-ink-200 p-3">
        <div className="flex items-center gap-2.5 px-1 pb-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-md bg-ink-100 text-xs font-semibold text-ink-700"
          >
            {initials(user.full_name)}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-medium text-ink-900">{user.full_name}</span>
            <span className="block truncate text-xs text-ink-500">
              {ROLE_LABEL[user.role]}
              {user.class && ` · ${user.class}`}
            </span>
          </span>
        </div>
        <Button variant="ghost" size="sm" icon="logOut" loading={loggingOut} onClick={handleLogout} className="w-full justify-start">
          Keluar
        </Button>
      </div>
    </div>
  )
}

/** Slide-in navigation for screens narrower than the sidebar breakpoint. */
function NavDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      data-side="left"
      aria-label="Menu"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-0 h-dvh max-h-none w-[min(18rem,85vw)] bg-white p-0 shadow-dialog"
    >
      {open && (
        <div className="relative h-full">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="absolute top-3 right-3 z-10 rounded-md p-1.5 text-ink-500 hover:bg-ink-100"
          >
            <Icon name="x" />
          </button>
          {children}
        </div>
      )}
    </dialog>
  )
}

/**
 * Staff application shell: a 232 px sidebar (brand, optional status block,
 * menu, identity) from `lg`; below that a top bar with the compact status and
 * a menu drawer.
 */
export function AppShell({ status, compactStatus }: { status?: ReactNode; compactStatus?: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <div className="min-h-screen lg:pl-[232px] print:pl-0">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-medium text-brand-800 shadow-pop focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Lewati ke konten
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] border-r border-ink-200 bg-white lg:block print:hidden">
        <SidebarContent status={status} />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-ink-200 bg-white px-3 sm:px-4 lg:hidden print:hidden">
        <button
          type="button"
          aria-label="Buka menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="rounded-md p-2 text-ink-700 hover:bg-ink-100"
        >
          <Icon name="menu" className="size-5" />
        </button>
        <BrandLockup />
        <div className="ml-auto min-w-0">{compactStatus}</div>
      </header>

      <NavDrawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        <SidebarContent status={status} onNavigate={() => setMenuOpen(false)} />
      </NavDrawer>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1240px] px-4 py-5 focus:outline-none sm:px-6 lg:px-8 lg:py-7 print:max-w-none print:p-0">
        <Outlet />
      </main>
    </div>
  )
}
