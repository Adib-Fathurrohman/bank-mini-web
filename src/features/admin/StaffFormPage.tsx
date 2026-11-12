import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import { createStaff, updateStaff, type StaffInput } from '@/api/endpoints/admin'
import type { ApiError } from '@/api/errors'
import type { Staff } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { LoadError, Loading } from '@/components/QueryStatus'
import { RadioCards } from '@/components/RadioCards'
import { TextField } from '@/components/TextField'
import { fieldError, type Flash } from '@/lib/flash'
import { useStaffMember } from '@/features/directory/queries'
import { useRefreshDirectory } from './queries'

type Role = StaffInput['role']

function StaffForm({ existing }: { existing: Staff | null }) {
  const navigate = useNavigate()
  const refresh = useRefreshDirectory()
  const [username, setUsername] = useState(existing?.username ?? '')
  const [fullName, setFullName] = useState(existing?.full_name ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(existing?.role === 'supervisor' ? 'supervisor' : 'teller')
  const [klass, setKlass] = useState(existing?.class ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [localError, setLocalError] = useState<string | null>(null)

  const mutation = useMutation<Staff, ApiError>({
    mutationFn: async () => {
      const body: StaffInput = {
        username: username.trim(),
        full_name: fullName.trim(),
        role,
        class: klass.trim() || null,
        phone: phone.trim() || null,
        // A new or changed address gets a verification link; an unchanged one is left alone by the backend.
        email: email.trim() || null,
      }
      if (password) body.password = password
      return (existing ? await updateStaff(existing.id, body) : await createStaff(body)).data
    },
    onSuccess: (staff) => {
      void refresh()
      navigate(`/staff/${staff.id}`, { state: { flash: existing ? 'Perubahan disimpan.' : 'Staf ditambahkan.' } satisfies Flash })
    },
    onError: () => setPassword(''),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!existing && password.length < 8) {
      setLocalError('Minimal 8 karakter.')
      return
    }
    if (existing && password !== '' && password.length < 8) {
      setLocalError('Minimal 8 karakter, atau kosongkan agar tidak diganti.')
      return
    }
    setLocalError(null)
    mutation.mutate()
  }

  const error = mutation.error
  const pending = mutation.isPending

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Panel className="flex flex-col gap-5 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
            maxLength={50}
            disabled={pending}
            error={fieldError(error, 'username')}
            hint="Huruf, angka, - atau _. Dipakai untuk masuk."
            inputClassName="font-mono"
          />
          <TextField
            label="Nama lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            maxLength={255}
            disabled={pending}
            error={fieldError(error, 'full_name')}
          />
          <TextField
            label={existing ? 'Password baru' : 'Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={pending}
            error={localError ?? fieldError(error, 'password')}
            hint={existing ? 'Kosongkan agar password tidak diganti.' : 'Minimal 8 karakter. Sampaikan langsung ke staf.'}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            disabled={pending}
            error={fieldError(error, 'email')}
            hint={
              existing?.email && existing.email !== email.trim()
                ? 'Email baru harus diverifikasi staf lewat tautan yang dikirim.'
                : 'Opsional. Dipakai untuk reset password; staf memverifikasinya lewat tautan yang dikirim.'
            }
          />
          <TextField
            label="No. HP / WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            maxLength={20}
            disabled={pending}
            error={fieldError(error, 'phone')}
            hint="Opsional."
          />
          <TextField
            label="Kelas"
            value={klass}
            onChange={(e) => setKlass(e.target.value)}
            maxLength={20}
            disabled={pending}
            error={fieldError(error, 'class')}
            hint="Opsional, untuk teller dari siswa piket. Contoh: XI AK 2"
          />
        </div>
        <RadioCards
          legend="Peran"
          name="role"
          value={role}
          onChange={setRole}
          disabled={pending}
          columns={2}
          options={[
            { value: 'teller', label: 'Teller', description: 'Membuka shift, melayani setor dan tarik di loket.' },
            { value: 'supervisor', label: 'Supervisor', description: 'Memverifikasi laporan harian dan mengotorisasi koreksi.' },
          ]}
        />
      </Panel>

      {error && error.kind !== 'validation' && <Alert title="Data tidak disimpan">{error.message}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending}>
          {existing ? 'Simpan perubahan' : 'Tambah staf'}
        </Button>
        <Link to={existing ? `/staff/${existing.id}` : '/staff'} className={buttonClass('secondary')}>
          Batal
        </Link>
      </div>
    </form>
  )
}

/** Create a teller or supervisor, or edit one (`/staff/:id/edit`). Administrator accounts cannot be edited. */
export function StaffFormPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const existing = useStaffMember(id ?? 0, id !== null)
  const editing = id !== null

  const back = (
    <Link
      to={editing ? `/staff/${id}` : '/staff'}
      className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900"
    >
      <Icon name="chevronLeft" className="size-3.5" />
      {editing ? 'Detail staf' : 'Staf'}
    </Link>
  )

  if (!editing) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <PageHeader back={back} title="Tambah staf" description="Akun teller atau supervisor. Administrator tidak dapat dibuat di sini." />
        <StaffForm existing={null} />
      </div>
    )
  }

  if (existing.isPending) return <Loading />
  if (existing.error) return <LoadError error={existing.error} onRetry={() => void existing.refetch()} />

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader back={back} title={`Ubah ${existing.data.full_name}`} />
      {existing.data.role === 'admin' ? (
        <Alert tone="warning" title="Akun administrator tidak dapat diubah" />
      ) : (
        <StaffForm existing={existing.data} />
      )}
    </div>
  )
}
