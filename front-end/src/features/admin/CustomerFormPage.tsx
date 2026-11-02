import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import { openAccount, updateCustomer, type CustomerInput, type CustomerUpdate } from '@/api/endpoints/admin'
import type { ApiError } from '@/api/errors'
import type { Customer, CustomerClass, CustomerGroup } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Icon } from '@/components/Icon'
import { Eyebrow, PageHeader, Panel } from '@/components/Page'
import { LoadError, Loading } from '@/components/QueryStatus'
import { RadioCards } from '@/components/RadioCards'
import { SelectField } from '@/components/SelectField'
import { TextField } from '@/components/TextField'
import { fieldError, type Flash } from '@/lib/flash'
import { CLASSES, classLabel, GROUPS } from '@/features/directory/labels'
import { AppStatusNotice } from '@/features/directory/AppStatusNotice'
import { useCustomer, useMajors } from '@/features/directory/queries'
import { useRefreshDirectory } from './queries'

type Status = 'active' | 'suspended'

function Created({ customer, onAnother }: { customer: Customer; onAnother: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <Eyebrow>Nomor rekening</Eyebrow>
          <p className="font-mono text-2xl font-semibold tracking-tight text-ink-900">{customer.account_number}</p>
        </div>
        <DataList>
          <DataRow label="Nama">{customer.full_name}</DataRow>
          <DataRow label="NIS" mono>
            {customer.nis}
          </DataRow>
          <DataRow label="Kelas">{classLabel(customer)}</DataRow>
          <DataRow label="Email">{customer.email}</DataRow>
          <DataRow label="Saldo">Rp0 · setoran pertama di loket</DataRow>
        </DataList>
      </Panel>
      <AppStatusNotice customer={customer} />
      <div className="flex flex-wrap gap-2">
        <Link to={`/customers/${customer.id}`} className={buttonClass('primary')}>
          Lihat rekening
        </Link>
        <Link to={`/customers/${customer.id}/card`} className={buttonClass('secondary')}>
          Cetak kartu
        </Link>
        <Button variant="secondary" icon="plus" onClick={onAnother}>
          Buka rekening lain
        </Button>
      </div>
    </div>
  )
}

/** Open an account (`/customers/new`) or edit one (`/customers/:id/edit`): data and status. No PIN: the student creates it. */
function CustomerForm({ existing, onCreated }: { existing: Customer | null; onCreated: (c: Customer) => void }) {
  const navigate = useNavigate()
  const refresh = useRefreshDirectory()
  const majors = useMajors()
  const [nis, setNis] = useState(existing?.nis ?? '')
  const [fullName, setFullName] = useState(existing?.full_name ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [klass, setKlass] = useState<CustomerClass | ''>(existing?.class ?? '')
  const [majorId, setMajorId] = useState(existing ? String(existing.major.id) : '')
  const [group, setGroup] = useState<CustomerGroup | ''>(existing?.group ?? '')
  const [status, setStatus] = useState<Status>(existing?.account_status === 'suspended' ? 'suspended' : 'active')
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})

  const emailLocked = existing?.activation_status === 'activated'

  const mutation = useMutation<Customer, ApiError>({
    mutationFn: async () => {
      if (!existing) {
        const body: CustomerInput = {
          nis: nis.trim(),
          full_name: fullName.trim(),
          email: email.trim(),
          class: klass as CustomerClass,
          major_id: Number(majorId),
          group: group as CustomerGroup,
        }
        return (await openAccount(body)).data
      }
      // Send only what changed (partial update).
      const body: CustomerUpdate = {}
      if (nis.trim() !== existing.nis) body.nis = nis.trim()
      if (fullName.trim() !== existing.full_name) body.full_name = fullName.trim()
      if (!emailLocked && email.trim() !== (existing.email ?? '')) body.email = email.trim()
      if (klass !== existing.class) body.class = klass as CustomerClass
      if (Number(majorId) !== existing.major.id) body.major_id = Number(majorId)
      if (group !== existing.group) body.group = group as CustomerGroup
      if (status !== existing.account_status) body.account_status = status
      return (await updateCustomer(existing.id, body)).data
    },
    onSuccess: (customer) => {
      void refresh()
      if (existing) {
        navigate(`/customers/${customer.id}`, { state: { flash: 'Perubahan disimpan.' } satisfies Flash })
      } else {
        onCreated(customer)
      }
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const errors: Record<string, string> = {}
    if (!nis.trim()) errors.nis = 'Wajib diisi.'
    if (!fullName.trim()) errors.full_name = 'Wajib diisi.'
    if (!emailLocked && !/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Isi alamat email yang valid.'
    if (!klass) errors.class = 'Pilih kelas.'
    if (!majorId) errors.major_id = 'Pilih jurusan.'
    if (!group) errors.group = 'Pilih rombel.'
    setLocalErrors(errors)
    if (Object.keys(errors).length === 0) mutation.mutate()
  }

  const error = mutation.error
  const pending = mutation.isPending
  const err = (name: string) => localErrors[name] ?? fieldError(error, name)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Panel className="flex flex-col gap-5 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="NIS" value={nis} onChange={(e) => setNis(e.target.value)} maxLength={20} inputMode="numeric" disabled={pending} error={err('nis')} inputClassName="font-mono" />
          <TextField label="Nama lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={255} disabled={pending} error={err('full_name')} />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            autoComplete="off"
            disabled={pending || emailLocked}
            error={err('email')}
            className="sm:col-span-2"
            hint={
              emailLocked
                ? 'Tidak dapat diubah karena siswa sudah mengaktifkan aplikasi.'
                : 'Siswa masuk ke aplikasi Bank Mini dengan email ini (akun Google atau email dan kata sandi), lalu mengisi NIS.'
            }
          />
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <SelectField label="Kelas" value={klass} onChange={(e) => setKlass(e.target.value as CustomerClass)} disabled={pending} error={err('class')}>
              <option value="">Pilih</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
            <SelectField label="Jurusan" value={majorId} onChange={(e) => setMajorId(e.target.value)} disabled={pending} error={err('major_id')}>
              <option value="">{majors.isPending ? 'Memuat…' : 'Pilih'}</option>
              {majors.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} · {m.major_name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Rombel" value={group} onChange={(e) => setGroup(e.target.value as CustomerGroup)} disabled={pending} error={err('group')}>
              <option value="">Pilih</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        {existing && (
          <RadioCards
            legend="Status rekening"
            name="account_status"
            value={status}
            onChange={setStatus}
            disabled={pending}
            columns={2}
            options={[
              { value: 'active', label: 'Aktif', description: 'Dapat setor dan tarik di loket.' },
              { value: 'suspended', label: 'Ditangguhkan', description: 'Hanya dapat melihat saldo; transaksi di loket ditolak.' },
            ]}
          />
        )}

        {!existing && (
          <p className="flex gap-2 rounded-lg border border-ink-200 px-3.5 py-3 text-[13px] text-ink-700">
            <Icon name="lock" className="mt-0.5 size-4 shrink-0 text-ink-500" />
            Tidak ada PIN dari petugas. Siswa membuat PIN sendiri di aplikasi setelah aktivasi, dan tidak perlu
            memberitahukannya kepada siapa pun.
          </p>
        )}
      </Panel>

      {error && error.kind !== 'validation' && <Alert title="Data tidak disimpan">{error.message}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending}>
          {existing ? 'Simpan perubahan' : 'Buka rekening'}
        </Button>
        <Link to={existing ? `/customers/${existing.id}` : '/customers'} className={buttonClass('secondary')}>
          Batal
        </Link>
      </div>
    </form>
  )
}

export function CustomerFormPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const existing = useCustomer(id ?? 0, id !== null)
  const [created, setCreated] = useState<Customer | null>(null)
  const [formKey, setFormKey] = useState(0)

  const back = (
    <Link
      to={id !== null ? `/customers/${id}` : '/customers'}
      className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900"
    >
      <Icon name="chevronLeft" className="size-3.5" />
      {id !== null ? 'Detail nasabah' : 'Nasabah'}
    </Link>
  )

  if (id === null) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <PageHeader
          back={back}
          title={created ? 'Rekening dibuka' : 'Buka rekening'}
          description={created ? undefined : 'Rekening tabungan siswa baru. Nomor rekening dibuat otomatis; saldo awal Rp0.'}
        />
        {created ? (
          <Created
            customer={created}
            onAnother={() => {
              setCreated(null)
              setFormKey((k) => k + 1)
            }}
          />
        ) : (
          <CustomerForm key={formKey} existing={null} onCreated={setCreated} />
        )}
      </div>
    )
  }

  if (existing.isPending) return <Loading />
  if (existing.error) return <LoadError error={existing.error} onRetry={() => void existing.refetch()} />

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader back={back} title={`Ubah ${existing.data.full_name}`} description={`${existing.data.account_number} · nomor rekening dan saldo tidak dapat diubah`} />
      {existing.data.deleted_at ? (
        <Alert tone="info" title="Rekening sudah ditutup dan tidak dapat diubah" />
      ) : (
        <CustomerForm existing={existing.data} onCreated={() => {}} />
      )}
    </div>
  )
}
