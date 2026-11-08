import { useId, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { importCustomers, type CustomerImportResult } from '@/api/endpoints/admin'
import type { ApiError } from '@/api/errors'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { PageHeader, Panel } from '@/components/Page'
import { formatRupiah } from '@/lib/money'
import { classLabel } from '@/features/directory/labels'
import { useMajors } from '@/features/directory/queries'
import { groupCustomerImportErrors, type RowError } from './importErrors'
import { useRefreshDirectory } from './queries'

const MAX_BYTES = 5 * 1024 * 1024

const CUSTOMER_COLUMNS: [string, string, string][] = [
  ['NIS', 'wajib, unik', 'nis'],
  ['Nama', 'wajib', 'nama, nama_lengkap, nama_siswa, full_name'],
  ['Kelas', 'wajib: X, XI, XII (atau "XI RPL 2")', 'kelas, class'],
  ['Jurusan', 'wajib: kode atau nama jurusan', 'jurusan, kode_jurusan, major'],
  ['Rombel', 'wajib: 1–4', 'rombel, kelompok, group'],
  ['Email', 'opsional, unik', 'email, e_mail'],
  ['Saldo', 'opsional, contoh 150000 atau "Rp 150.000"', 'saldo, saldo_akhir, balance'],
  ['No. rekening', 'opsional, dibuat otomatis bila kosong', 'no_rekening, nomor_rekening, account_number'],
]

const TRANSACTION_COLUMNS: [string, string, string][] = [
  ['NIS', 'wajib, ada di daftar nasabah', 'nis'],
  ['Tanggal', 'wajib: YYYY-MM-DD, DD/MM/YYYY atau tanggal Excel', 'tanggal, tgl, date'],
  ['Jenis', 'wajib: setor atau tarik', 'jenis, jenis_transaksi, type'],
  ['Nominal', 'wajib, lebih dari 0', 'nominal, jumlah, amount'],
  ['Keterangan', 'opsional', 'keterangan, catatan, note'],
]

const CUSTOMER_EXAMPLE = [
  'NIS,Nama,Email,Kelas,Jurusan,Rombel,Saldo,No Rekening',
  '20250101,Rina Kartika,rina@example.test,XI,RPL,1,150000,',
  '20250102,Bayu Saputra,,XI RPL 2,,,75000,',
].join('\n')

const TRANSACTION_EXAMPLE = [
  'NIS,Tanggal,Jenis,Nominal,Keterangan',
  '20250101,2026-07-15,setor,100000,Setoran awal',
  '20250101,2026-08-02,tarik,25000,',
].join('\n')

function downloadExample(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function checkFile(file: File): string | null {
  if (!/\.(xlsx|csv)$/i.test(file.name)) return 'File harus berformat .xlsx atau .csv.'
  if (file.size > MAX_BYTES) return 'Ukuran file maksimal 5 MB.'
  return null
}

function ColumnTable({ columns }: { columns: [string, string, string][] }) {
  return (
    <table className="w-full text-[13px]">
      <tbody className="divide-y divide-ink-100">
        {columns.map(([label, rule, headers]) => (
          <tr key={label}>
            <th scope="row" className="py-1.5 pr-3 text-left align-top font-medium whitespace-nowrap text-ink-800">
              {label}
            </th>
            <td className="py-1.5 pr-3 align-top text-ink-500">{rule}</td>
            <td className="hidden py-1.5 align-top font-mono text-xs text-ink-600 sm:table-cell">{headers}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FileField({
  label,
  hint,
  error,
  disabled,
  onChange,
}: {
  label: string
  hint: string
  error: string | null
  disabled: boolean
  onChange: (file: File | null) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink-700">
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        aria-describedby={`${id}-hint`}
        aria-invalid={error ? true : undefined}
        className="block w-full text-sm text-ink-700 file:mr-3 file:h-9 file:rounded-md file:border file:border-ink-300 file:bg-white file:px-3 file:text-sm file:font-medium file:text-ink-800 hover:file:bg-ink-50"
      />
      <p id={`${id}-hint`} className="text-xs text-ink-500">
        {hint}
      </p>
      {error && <p className="text-xs font-medium text-neg-700">{error}</p>}
    </div>
  )
}

function RowErrorList({ title, rows }: { title: string; rows: RowError[] }) {
  if (rows.length === 0) return null
  return (
    <div className="mt-2">
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.row}>
            <span className="font-semibold">Baris {r.row}:</span> {r.messages.join(' · ')}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** What was created: counts, accounts still without an email, and the accounts. */
function ImportResult({ result }: { result: CustomerImportResult }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert tone="success" title={`${result.customers_created} rekening nasabah dibuat`}>
        {result.transactions_created > 0
          ? `${result.transactions_created} transaksi riwayat ikut diimpor, termasuk saldo awal bila saldo lebih besar dari riwayat.`
          : 'Saldo setiap rekening tercatat sebagai saldo awal dari pembukuan lama.'}{' '}
        Riwayat impor tidak masuk laporan shift teller dan tidak dapat dikoreksi.
      </Alert>
      {result.customers_without_email > 0 && (
        <Alert
          tone="warning"
          title={`${result.customers_without_email} rekening belum punya email`}
          action={
            <Link to="/customers?email=missing" className={buttonClass('secondary', 'sm')}>
              Lihat daftar
            </Link>
          }
        >
          Siswa ini belum dapat mengaktifkan aplikasi. Tambahkan email lewat Ubah pada tiap rekening; setor tunai di loket
          sudah bisa sekarang.
        </Alert>
      )}
      <Panel className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs text-ink-500">
              <th scope="col" className="py-2 pr-3 pl-4 font-medium">
                Nama
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Rekening
              </th>
              <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">
                Kelas
              </th>
              <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">
                Email
              </th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">
                Saldo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {result.customers.map((c) => (
              <tr key={c.id} className="hover:bg-ink-50/60">
                <td className="max-w-56 py-2.5 pr-3 pl-4">
                  <Link to={`/customers/${c.id}`} className="block truncate font-medium text-brand-700 hover:underline">
                    {c.full_name}
                  </Link>
                  <span className="text-xs text-ink-500">NIS {c.nis}</span>
                </td>
                <td className="py-2.5 pr-3 font-mono text-[13px] text-ink-700">{c.account_number}</td>
                <td className="hidden py-2.5 pr-3 whitespace-nowrap text-ink-700 md:table-cell">{classLabel(c)}</td>
                <td className="hidden max-w-56 truncate py-2.5 pr-3 lg:table-cell">
                  {c.email ?? <span className="text-warn-700">Belum ada</span>}
                </td>
                <td className="py-2.5 pr-4 text-right whitespace-nowrap text-ink-900">{formatRupiah(c.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <div className="flex flex-wrap gap-2">
        <Link to="/customers" className={buttonClass('primary')}>
          Selesai
        </Link>
      </div>
    </div>
  )
}

/**
 * Bring existing savers over from the old bookkeeping (.xlsx/.csv): customers with
 * their balance and, optionally, their transaction history. All or nothing.
 */
export function CustomerImportPage() {
  const refresh = useRefreshDirectory()
  const majors = useMajors()
  const [file, setFile] = useState<File | null>(null)
  const [historyFile, setHistoryFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const mutation = useMutation<CustomerImportResult, ApiError, { file: File; history: File | null }>({
    mutationFn: async ({ file: f, history }) => (await importCustomers(f, history)).data,
    onSuccess: () => void refresh(),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const main = file ? checkFile(file) : 'Pilih file daftar nasabah.'
    const extra = historyFile ? checkFile(historyFile) : null
    setFileError(main)
    setHistoryError(extra)
    if (main || extra || !file) return
    mutation.mutate({ file, history: historyFile })
  }

  const back = (
    <Link to="/customers" className="mb-1 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-900">
      <Icon name="chevronLeft" className="size-3.5" />
      Nasabah
    </Link>
  )

  if (mutation.data) {
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <PageHeader back={back} title="Hasil impor nasabah" />
        <ImportResult result={mutation.data} />
      </div>
    )
  }

  const errors = mutation.error?.kind === 'validation' ? groupCustomerImportErrors(mutation.error.fieldErrors) : null
  const majorCodes = majors.data?.map((m) => m.code).join(', ')

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        back={back}
        title="Impor nasabah"
        description="Pindahkan penabung dari pembukuan lama sekaligus: data siswa, saldo, dan bila ada, riwayat transaksinya. Jika satu baris salah, tidak ada yang disimpan."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Panel className="flex flex-col gap-5 p-4 sm:p-5">
          <FileField
            label="Daftar nasabah (wajib)"
            hint={'.xlsx atau .csv, maksimal 5 MB dan 1.000 nasabah. Riwayat boleh ada di sheet "Transaksi" pada file yang sama.'}
            error={fileError}
            disabled={mutation.isPending}
            onChange={(f) => {
              setFile(f)
              setFileError(null)
              mutation.reset()
            }}
          />
          <FileField
            label="Riwayat transaksi (opsional)"
            hint="File terpisah bila riwayat tidak ada di sheet Transaksi. Maksimal 5 MB dan 10.000 transaksi."
            error={historyError}
            disabled={mutation.isPending}
            onChange={(f) => {
              setHistoryFile(f)
              setHistoryError(null)
              mutation.reset()
            }}
          />
        </Panel>

        {errors && (
          <Alert title="Tidak ada data yang disimpan">
            <p>Perbaiki baris berikut di file, lalu impor lagi. Baris 1 adalah judul kolom.</p>
            {errors.general.map((m) => (
              <p key={m}>{m}</p>
            ))}
            <RowErrorList title="Daftar nasabah" rows={errors.rows} />
            <RowErrorList title="Riwayat transaksi" rows={errors.transactions} />
          </Alert>
        )}
        {mutation.error && !errors && <Alert title="Impor gagal">{mutation.error.message}</Alert>}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" icon="upload" loading={mutation.isPending}>
            Impor
          </Button>
          <Link to="/customers" className={buttonClass('secondary')}>
            Batal
          </Link>
        </div>

        <Panel className="flex flex-col gap-5 p-4 sm:p-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink-900">Kolom daftar nasabah</h2>
              <Button
                variant="ghost"
                size="sm"
                icon="file"
                onClick={() => downloadExample('contoh-impor-nasabah.csv', CUSTOMER_EXAMPLE)}
              >
                Contoh CSV
              </Button>
            </div>
            <ColumnTable columns={CUSTOMER_COLUMNS} />
            {majorCodes && <p className="text-xs text-ink-500">Kode jurusan: {majorCodes}.</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink-900">Kolom riwayat transaksi</h2>
              <Button
                variant="ghost"
                size="sm"
                icon="file"
                onClick={() => downloadExample('contoh-impor-transaksi.csv', TRANSACTION_EXAMPLE)}
              >
                Contoh CSV
              </Button>
            </div>
            <ColumnTable columns={TRANSACTION_COLUMNS} />
          </div>

          <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] text-ink-600">
            <li>Baris pertama setiap sheet adalah judul kolom; urutan kolom bebas.</li>
            <li>
              Jika saldo lebih besar dari jumlah riwayat, selisihnya dicatat sebagai saldo awal sebelum transaksi pertama.
              Saldo yang lebih kecil dari riwayat, atau riwayat yang membuat saldo minus, ditolak.
            </li>
            <li>Nasabah tanpa email tetap bisa setor di loket, tetapi belum bisa mengaktifkan aplikasi sampai email ditambahkan.</li>
            <li>Transaksi hasil impor tidak masuk laporan shift teller dan tidak dapat dikoreksi.</li>
          </ul>
        </Panel>
      </form>
    </div>
  )
}
