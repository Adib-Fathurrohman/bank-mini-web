import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { requestPasswordReset } from '@/api/endpoints/auth'
import type { ApiError } from '@/api/errors'
import type { MessageResponse } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { formError, looksLikeEmail } from '@/lib/authForms'
import { AuthCard } from './AuthCard'

/**
 * "Lupa password?": the staff member types the verified email; the answer is always the
 * same message, so the page never reveals which emails exist.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const request = useMutation<MessageResponse, ApiError>({ mutationFn: () => requestPasswordReset(email.trim()) })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (request.isPending) return
    if (!looksLikeEmail(email)) return setLocalError('Isi alamat email yang valid.')
    setLocalError(null)
    request.mutate()
  }

  const error = request.error
  const fieldError = localError ?? (error?.kind === 'validation' ? error.field('email') : undefined)
  const banner = error && !fieldError ? formError(error) : null

  return (
    <AuthCard
      title="Lupa password"
      description="Masukkan email yang terdaftar dan sudah diverifikasi di profil Anda."
      footer={
        <>
          Tidak punya email terverifikasi? Hubungi administrator.
          <br />
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Kembali ke halaman masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-6">
        {request.isSuccess && (
          <Alert tone="success" title="Periksa email Anda">
            {request.data.message}
          </Alert>
        )}
        {banner && <Alert>{banner}</Alert>}
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={request.isPending}
          error={fieldError}
        />
        <Button type="submit" size="lg" loading={request.isPending} className="w-full">
          {request.isSuccess ? 'Kirim ulang tautan' : 'Kirim tautan reset'}
        </Button>
      </form>
    </AuthCard>
  )
}
