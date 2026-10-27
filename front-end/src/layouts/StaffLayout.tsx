import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth, useCurrentUser } from '@/auth/context'
import { ROLE_HOME, ROLE_LABEL } from '@/auth/session'
import { Button } from '@/components/Button'
import { NAVIGATION } from './navigation'

export function StaffLayout() {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const items = NAVIGATION[user.role]

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  const nav = (
    <nav aria-label="Menu utama" className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === ROLE_HOME[user.role]}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-100'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white px-3 py-4 lg:block">
        <p className="px-3 pb-4 text-sm font-bold text-brand-800">E-Teller Bank Mini</p>
        {nav}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
          <p className="text-sm font-bold text-brand-800 lg:hidden">E-Teller Bank Mini</p>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
            </div>
            <Button variant="secondary" onClick={handleLogout} loading={loggingOut}>
              Keluar
            </Button>
          </div>
        </header>

        {menuOpen && (
          <div id="mobile-menu" className="border-b border-slate-200 bg-white px-3 py-3 lg:hidden">
            {nav}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
