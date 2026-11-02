import { useId, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { importStaff, type ImportedStaff } from '@/api/endpoints/admin'
import type { ApiError } from '@/api/errors'
import { ROLE_LABEL } from '@/auth/session'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { groupImportErrors } from './importErrors'
import { useRefreshDirectory } from './queries'

const MAX_BYTES = 2 * 1024 * 1024

const COLUMNS: [string, string, string][] = [
  ['Username', 'wajib', 'username'],
  ['Nama', 'wajib', 'nama, nama_lengkap, full_name'],
  ['Password', 'opsional, min. 8', 'password, kata_sandi'],
  ['Peran', 'opsional, bawaan teller', 'peran, role'],
  ['Kelas', 'opsional', 'kelas, class'],
  ['No. HP', 'opsional', 'no_wa, whatsapp, no_hp, phone'],
]

/** The created accounts; passwords the system generated are shown only here, once. */
function ImportResult({ users }: { users: ImportedStaff[] }) {
  const generated = users.filter((u) => u.generated_password)
  const [copied, setCopied] = useState(false)

  async function copy() {
    const text = generated.map((u) => `${u.username}\t${u.generated_password}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert tone="success" title={`${users.length} akun staf dibuat`}>
        {generated.length > 0
          ? `${generated.length} akun memakai password buatan sistem. Catat atau cetak sekarang: password ini tidak dapat dilihat lagi.`
          : 'Semua akun memakai password dari file.'}
      </Alert>
      <Panel className="overflow-hidden print:border-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
              <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                Username
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Nama
              </th>
              <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">
                Peran
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Password
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-2.5 pr-3 pl-4 font-mono text-[13px] text-ink-900">{u.username}</td>
                <td className="max-w-48 truncate py-2.5 pr-3 text-ink-900">{u.full_name}</td>
                <td className="hidden py-2.5 pr-3 text-ink-700 sm:table-cell">{ROLE_LABEL[u.role]}</td>
                <td className="py-2.5 pr-4 font-mono text-[13px]">
                  {u.generated_password ?? <span className="font-sans text-ink-500">dari file</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <div className="flex flex-wrap gap-2 print:hidden">
        {generated.length > 0 && (
          <>
            <Button variant="secondary" icon="file" onClick={() => void copy()}>
              {copied ? 'Tersalin' : 'Salin password'}
            </Button>
            <Button variant="secondary" icon="printer" onClick={() => window.print()}>
              Cetak
            </Button>
          </>
        )}
        <Link to="/staff" className={buttonClass('primary')}>
          Selesai
        </Link>
      </div>
    </div>
  )
}

/** Create many tellers from the duty list (.xlsx/.csv). All rows succeed or none are saved. */
export function StaffImportPage() {
  const inputId = useId()
  const refresh = useRefreshDirectory()
  const [file, setFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const mutation = useMutation<ImportedStaff[], ApiError, File>({
    mutationFn: async (f) => (await importStaff(f)).data.users,
    onSuccess: () => void refresh(),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      setLocalError('Pilih file terlebih dahulu.')
      return
    }
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setLocalError('File harus berformat .xlsx atau .csv.')
      return
    }
    if (file.size > MAX_BYTES) {
      setLocalError('Ukuran file maksimal 2 MB.')
      return
    }
    setLocalError(null)
    mutation.mutate(file)
  }

  const back = (
    <Link to="/staff" className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900 print:hidden">
      <Icon name="chevronLeft" className="size-3.5" />
      Staf
    </Link>
  )

  if (mutation.data) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <PageHeader back={back} title="Hasil impor staf" />
        <ImportResult users={mutation.data} />
      </div>
    )
  }

  const errors = mutation.error?.kind === 'validation' ? groupImportErrors(mutation.error.fieldErrors) : null

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        back={back}
        title="Impor staf"
        description="Buat banyak akun teller sekaligus dari daftar piket. Jika satu baris salah, tidak ada akun yang dibuat."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Panel className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="text-[13px] font-medium text-ink-700">
              File Excel atau CSV
            </label>
            <input
              id={inputId}
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              disabled={mutation.isPending}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setLocalError(null)
                mutation.reset()
              }}
              aria-describedby={`${inputId}-hint`}
              className="block w-full text-sm text-ink-700 file:mr-3 file:h-9 file:rounded-md file:border file:border-ink-300 file:bg-white file:px-3 file:text-sm file:font-medium file:text-ink-800 hover:file:bg-ink-50"
            />
            <p id={`${inputId}-hint`} className="text-xs text-ink-500">
              .xlsx atau .csv (pemisah koma atau titik koma), maksimal 2 MB dan 500 baris. Baris pertama adalah judul kolom.
            </p>
            {localError && <p className="text-xs font-medium text-neg-700">{localError}</p>}
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-700">Kolom yang dikenali</p>
            <table className="w-full text-[13px]">
              <tbody className="divide-y divide-ink-100">
                {COLUMNS.map(([label, rule, headers]) => (
                  <tr key={label}>
                    <th scope="row" className="py-1.5 pr-3 text-left font-medium text-ink-800">
                      {label}
                    </th>
                    <td className="py-1.5 pr-3 text-ink-500">{rule}</td>
                    <td className="py-1.5 font-mono text-xs text-ink-600">{headers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-ink-500">Baris tanpa password mendapat password acak yang ditampilkan sekali setelah impor.</p>
          </div>
        </Panel>

        {errors && (
          <Alert title="Tidak ada akun yang dibuat">
            <p>Perbaiki baris berikut di file, lalu impor lagi.</p>
            {errors.general.map((m) => (
              <p key={m}>{m}</p>
            ))}
            {errors.rows.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {errors.rows.map((r) => (
                  <li key={r.row}>
                    <span className="font-semibold">Baris {r.row}:</span> {r.messages.join(' · ')}
                  </li>
                ))}
              </ul>
            )}
          </Alert>
        )}
        {mutation.error && !errors && <Alert title="Impor gagal">{mutation.error.message}</Alert>}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" icon="upload" loading={mutation.isPending}>
            Impor
          </Button>
          <Link to="/staff" className={buttonClass('secondary')}>
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
