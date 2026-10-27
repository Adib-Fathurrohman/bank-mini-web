import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { isApiError, networkError, type ApiError } from '@/api/errors'
import { useAuth } from '@/auth/context'
import { ROLE_HOME } from '@/auth/session'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'

export function LoginPage() {
  const { state, notice, login, clearNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  if (state.status === 'authenticated' && !pending) {
    return <Navigate to={ROLE_HOME[state.user.role]} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    clearNotice()
    try {
      const user = await login(username.trim(), password)
      const from = (location.state as { from?: string } | null)?.from
      const home = ROLE_HOME[user.role]
      navigate(from && from.startsWith(home) ? from : home, { replace: true })
    } catch (caught) {
      setError(isApiError(caught) ? caught : networkError(caught))
      setPassword('')
    } finally {
      setPending(false)
    }
  }

  // Wrong credentials and blocked accounts come back as a 422 on `username`.
  const usernameError = error?.field('username')
  const passwordError = error?.field('password')
  const bannerError = error && !usernameError && !passwordError ? error.message : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase">E-Teller Bank Mini</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Masuk Staf</h1>
          <p className="mt-1 text-sm text-slate-600">Administrator, supervisor, dan teller.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          {notice && <Alert tone="warning">{notice}</Alert>}
          {bannerError && <Alert>{bannerError}</Alert>}

          <TextField
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={usernameError}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />

          <Button type="submit" loading={pending} className="mt-2 w-full py-2.5">
            {pending ? 'Memproses…' : 'Masuk'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Lupa password? Hubungi administrator.
          <br />
          Nasabah masuk melalui aplikasi mobile.
        </p>
      </div>
    </main>
  )
}
