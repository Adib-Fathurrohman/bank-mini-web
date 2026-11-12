import { useEffect, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { changeOwnPassword, fetchMe, resendEmailVerification, updateOwnEmail } from '@/api/endpoints/auth'
import type { ApiError } from '@/api/errors'
import type { MessageResponse, Single, Staff } from '@/api/types'
import { useAuth, useCurrentUser } from '@/auth/context'
import { ROLE_LABEL } from '@/auth/session'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { PageHeader, Panel, Section } from '@/components/Page'
import { TextField } from '@/components/TextField'
import { formError, looksLikeEmail, passwordProblem } from '@/lib/authForms'

/**
 * The own account, for every role (admin included): the email that password reset
 * by email needs, and the password. Both ask for the current password.
 */
export function ProfilePage() {
  const user = useCurrentUser()
  const { updateUser } = useAuth()
  const [params] = useSearchParams()
  const verified = params.get('email_verified')

  // The email may have been verified in another tab or from the email: show the current state.
  useEffect(() => {
    void fetchMe()
      .then(({ data }) => updateUser(data))
      .catch(() => undefined)
  }, [updateUser])

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title="Profil saya" description={`${user.full_name} · ${ROLE_LABEL[user.role]}`} />
      {verified === '1' && <Alert tone="success" title="Email berhasil diverifikasi" />}
      {verified === '0' && <Alert tone="warning" title="Tautan verifikasi tidak valid atau kedaluwarsa">Kirim ulang verifikasi dari bagian Email di bawah.</Alert>}

      <Panel className="px-4">
        <DataList>
          <DataRow label="Username" mono>
            {user.username}
          </DataRow>
          <DataRow label="Nama lengkap">{user.full_name}</DataRow>
          <DataRow label="Peran">{ROLE_LABEL[user.role]}</DataRow>
          <DataRow label="Email">
            {user.email ? (
              <span className="flex flex-wrap items-center justify-end gap-2">
                {user.email}
                <Badge tone={user.email_verified ? 'success' : 'warning'}>
                  {user.email_verified ? 'Terverifikasi' : 'Belum diverifikasi'}
                </Badge>
              </span>
            ) : (
              <span className="text-ink-500">Belum ada</span>
            )}
          </DataRow>
        </DataList>
      </Panel>

      <Section
        title="Email"
        description="Dipakai untuk mengatur ulang password lewat tautan di email. Alamat baru harus diverifikasi lebih dulu."
      >
        <EmailForm user={user} />
      </Section>

      <Section title="Ubah password" description="Perangkat lain yang sedang masuk akan dikeluarkan; sesi ini tetap berjalan.">
        <PasswordForm />
      </Section>
    </div>
  )
}

function EmailForm({ user }: { user: Staff }) {
  const { updateUser } = useAuth()
  const [email, setEmail] = useState(user.email ?? '')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [done, setDone] = useState<'saved' | 'removed' | null>(null)

  const save = useMutation<Single<Staff>, ApiError, string | null>({
    mutationFn: (next) => updateOwnEmail(next, password),
    onSuccess: ({ data }, next) => {
      updateUser(data)
      setEmail(data.email ?? '')
      setDone(next === null ? 'removed' : 'saved')
    },
    onSettled: () => setPassword(''),
  })

  const resend = useMutation<MessageResponse, ApiError>({ mutationFn: resendEmailVerification })

  function submit(next: string | null) {
    setDone(null)
    setLocalError(null)
    resend.reset()
    if (!password) return setLocalError('Isi password saat ini.')
    if (next !== null && !looksLikeEmail(next)) return setLocalError('Isi alamat email yang valid.')
    save.mutate(next)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim()
    submit(trimmed === '' ? null : trimmed)
  }

  const error = save.error
  const passwordError = localError ?? (error?.kind === 'validation' ? error.field('current_password') : undefined)
  const emailError = error?.kind === 'validation' ? error.field('email') : undefined
  const banner = error && !passwordError && !emailError ? formError(error) : null

  return (
    <Panel className="p-4 sm:p-5">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {done === 'saved' && (
          <Alert tone="success" title="Cek email untuk verifikasi">
            Tautan verifikasi dikirim ke {user.email}. Tautan berlaku 24 jam. Email baru dapat dipakai untuk reset password
            setelah diverifikasi.
          </Alert>
        )}
        {done === 'removed' && <Alert tone="success" title="Email dihapus" />}
        {user.email && !user.email_verified && done !== 'saved' && (
          <Alert
            tone="warning"
            title="Email belum diverifikasi"
            action={
              <Button variant="secondary" size="sm" loading={resend.isPending} onClick={() => resend.mutate()}>
                Kirim ulang verifikasi
              </Button>
            }
          >
            Buka tautan di email {user.email} agar bisa dipakai untuk mengatur ulang password.
          </Alert>
        )}
        {resend.isSuccess && <Alert tone="success">{resend.data.message}</Alert>}
        {resend.error && (
          <Alert tone={resend.error.code === 'email_already_verified' ? 'info' : 'error'}>{formError(resend.error)}</Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Alamat email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={save.isPending}
            error={emailError}
            hint="Kosongkan lalu simpan untuk menghapus email."
          />
          <TextField
            label="Password saat ini"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={save.isPending}
            error={passwordError}
          />
        </div>
        {banner && <Alert title="Email tidak disimpan">{banner}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={save.isPending}>
            Simpan email
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const change = useMutation<MessageResponse, ApiError>({
    mutationFn: () => changeOwnPassword({ current_password: current, password: next, password_confirmation: confirmation }),
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setConfirmation('')
    },
    onError: () => setCurrent(''),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    change.reset()
    if (!current) return setLocalError('Isi password saat ini.')
    const problem = passwordProblem(next, confirmation)
    if (problem) return setLocalError(problem)
    setLocalError(null)
    change.mutate()
  }

  const error = change.error
  const currentInvalid = error?.code === 'current_password_invalid'
  const fieldCurrent = error?.kind === 'validation' ? error.field('current_password') : undefined
  const fieldNew = error?.kind === 'validation' ? (error.field('password') ?? error.field('password_confirmation')) : undefined
  const banner = error && !currentInvalid && !fieldCurrent && !fieldNew ? formError(error) : null

  return (
    <Panel className="p-4 sm:p-5">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {change.isSuccess && (
          <Alert tone="success" title="Password diubah">
            {change.data.message}
          </Alert>
        )}
        <TextField
          label="Password saat ini"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          disabled={change.isPending}
          error={currentInvalid ? error.message : fieldCurrent}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Password baru"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            disabled={change.isPending}
            error={localError ?? fieldNew}
            hint="Minimal 8 karakter, berbeda dari yang sekarang."
          />
          <TextField
            label="Ulangi password baru"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={change.isPending}
          />
        </div>
        {banner && <Alert title="Password tidak diubah">{banner}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={change.isPending}>
            Simpan password
          </Button>
        </div>
      </form>
    </Panel>
  )
}
