import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { isApiError, networkError, type ApiError } from '@/api/errors'
import { useAuth } from '@/auth/context'
import { ROLE_HOME } from '@/auth/session'
import { Alert } from '@/components/Alert'
import { BrandLockup } from '@/components/BrandMark'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'

export function LoginPage() {
  const { state, notice, login, clearNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  if (state.status === 'authenticated' && !pending) {
    // The link in the verification email lands here: someone already signed in sees the outcome on the profile.
    const verifiedParam = params.get('email_verified')
    if (verifiedParam === '1' || verifiedParam === '0') {
      return <Navigate to={`/profile?email_verified=${verifiedParam}`} replace />
    }
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

  // Messages handed over by other pages and by the links in emails.
  const success = (location.state as { success?: string } | null)?.success
  const verified = params.get('email_verified')

  // Wrong credentials and blocked accounts come back as a 422 on `username`.
  const usernameError = error?.field('username')
  const passwordError = error?.field('password')
  const bannerError = error && !usernameError && !passwordError ? error.message : null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <BrandLockup subtitle="E-Teller · Staf" />
          <div>
            <h1 className="text-xl font-semibold text-ink-900">Masuk</h1>
            <p className="mt-1 text-sm text-ink-600">Untuk administrator, supervisor, dan teller.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-6"
        >
          {success && <Alert tone="success">{success}</Alert>}
          {verified === '1' && (
            <Alert tone="success" title="Email berhasil diverifikasi">
              Lupa password? Pilih &quot;Lupa password?&quot; di bawah, masukkan email ini, lalu buka tautan di email kedua untuk
              membuat password baru.
            </Alert>
          )}
          {verified === '0' && <Alert tone="warning">Tautan verifikasi tidak valid atau kedaluwarsa.</Alert>}
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

          <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
            {pending ? 'Memproses…' : 'Masuk'}
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px] leading-relaxed text-ink-500">
          <Link to="/forgot-password" className="font-medium text-brand-700 hover:underline">
            Lupa password?
          </Link>{' '}
          Atur ulang lewat email, atau hubungi administrator.
          <br />
          Nasabah masuk melalui aplikasi Bank Mini di ponsel.
        </p>
      </div>
    </main>
  )
}
