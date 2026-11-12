import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { resetPassword } from '@/api/endpoints/auth'
import type { ApiError } from '@/api/errors'
import type { MessageResponse } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { formError, passwordProblem } from '@/lib/authForms'
import { AuthCard } from './AuthCard'

/**
 * `/reset-password?token=…&email=…`, the link in the reset email. A new password with
 * its confirmation; success goes to the login page. A wrong, used or expired link is
 * `422 password_reset_invalid`: ask for a new one.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const reset = useMutation<MessageResponse, ApiError>({
    mutationFn: () => resetPassword({ email, token, password, password_confirmation: confirmation }),
    onSuccess: (data) => navigate('/login', { replace: true, state: { success: data.message } }),
    onError: () => {
      setPassword('')
      setConfirmation('')
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (reset.isPending) return
    const problem = passwordProblem(password, confirmation)
    if (problem) return setLocalError(problem)
    setLocalError(null)
    reset.mutate()
  }

  const newLink = (
    <Link to="/forgot-password" className={buttonClass('secondary', 'md', 'w-full')}>
      Minta tautan baru
    </Link>
  )

  if (!token || !email) {
    return (
      <AuthCard title="Atur ulang password">
        <div className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-6">
          <Alert title="Tautan tidak valid">Tautan ini tidak lengkap. Minta tautan reset yang baru.</Alert>
          {newLink}
        </div>
      </AuthCard>
    )
  }

  const error = reset.error
  const invalidLink = error?.code === 'password_reset_invalid'
  const fieldError = localError ?? (error?.kind === 'validation' ? (error.field('password') ?? error.field('password_confirmation')) : undefined)
  const banner = error && !invalidLink && !fieldError ? formError(error) : null

  return (
    <AuthCard
      title="Atur ulang password"
      description={`Password baru untuk ${email}.`}
      footer={
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Kembali ke halaman masuk
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-6">
        {invalidLink && (
          <Alert title="Tautan tidak valid atau kedaluwarsa">
            Tautan reset berlaku 60 menit dan hanya sekali pakai.
            <div className="mt-3">{newLink}</div>
          </Alert>
        )}
        {banner && <Alert>{banner}</Alert>}
        <TextField
          label="Password baru"
          type="password"
          name="password"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={reset.isPending}
          error={fieldError}
          hint="Minimal 8 karakter."
        />
        <TextField
          label="Ulangi password baru"
          type="password"
          name="password_confirmation"
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          disabled={reset.isPending}
        />
        <Button type="submit" size="lg" loading={reset.isPending} className="w-full">
          Simpan password baru
        </Button>
      </form>
    </AuthCard>
  )
}
