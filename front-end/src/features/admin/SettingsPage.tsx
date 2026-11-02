import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSettings } from '@/api/endpoints/admin'
import type { ApiError } from '@/api/errors'
import type { QrScannerMode, Settings, WithdrawalVerification } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { MoneyInput } from '@/components/MoneyInput'
import { PageHeader, Panel } from '@/components/Page'
import { LoadError, Loading } from '@/components/QueryStatus'
import { RadioCards } from '@/components/RadioCards'
import { formatRupiah } from '@/lib/money'
import { useSettings } from '@/features/teller/queries'

const MIN_BALANCE_MAX = 1_000_000

function SettingsForm({ current }: { current: Settings }) {
  const queryClient = useQueryClient()
  const [minBalance, setMinBalance] = useState<number | null>(current.min_balance)
  const [scanner, setScanner] = useState<QrScannerMode>(current.qr_scanner_mode)
  const [verification, setVerification] = useState<WithdrawalVerification>(current.withdrawal_verification)
  const [localError, setLocalError] = useState<string | null>(null)

  const mutation = useMutation<Settings, ApiError>({
    mutationFn: async () =>
      (await updateSettings({ min_balance: minBalance ?? 0, qr_scanner_mode: scanner, withdrawal_verification: verification })).data,
    onSuccess: (saved) => queryClient.setQueryData(['settings'], saved),
  })

  const changed =
    minBalance !== current.min_balance || scanner !== current.qr_scanner_mode || verification !== current.withdrawal_verification

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (minBalance === null || minBalance < 0 || minBalance > MIN_BALANCE_MAX) {
      setLocalError(`Isi antara Rp0 dan ${formatRupiah(MIN_BALANCE_MAX)}.`)
      return
    }
    setLocalError(null)
    mutation.mutate()
  }

  const fieldError = mutation.error?.kind === 'validation' ? mutation.error : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Panel className="flex flex-col gap-6 p-4 sm:p-5">
        <MoneyInput
          label="Saldo minimum"
          value={minBalance}
          onChange={(value) => {
            setMinBalance(value)
            mutation.reset()
          }}
          error={localError ?? fieldError?.field('min_balance')}
          hint="Saldo yang harus tersisa setelah penarikan. Rp0 – Rp1.000.000."
          className="max-w-xs"
        />

        <RadioCards
          legend="Pemindai QR di loket"
          name="qr_scanner_mode"
          value={scanner}
          onChange={(value) => {
            setScanner(value)
            mutation.reset()
          }}
          columns={3}
          options={[
            { value: 'webcam', label: 'Kamera', description: 'Teller memindai kartu dengan webcam.' },
            { value: 'usb', label: 'Pemindai USB', description: 'Alat pemindai yang mengetik seperti keyboard.' },
            { value: 'disabled', label: 'Ketik manual', description: 'Teller mengetik NIS atau nomor rekening.' },
          ]}
        />

        <RadioCards
          legend="Verifikasi penarikan"
          name="withdrawal_verification"
          value={verification}
          onChange={(value) => {
            setVerification(value)
            mutation.reset()
          }}
          options={[
            {
              value: 'mobile',
              label: 'Persetujuan di aplikasi nasabah (disarankan)',
              description: 'Nasabah menyetujui dengan PIN di HP-nya sendiri. Teller tidak pernah melihat PIN.',
            },
            {
              value: 'terminal',
              label: 'PIN di loket',
              description: 'Nasabah mengetik PIN di layar teller. Layar teller aplikasi ini tidak menyediakan cara ini, sehingga penarikan di loket tidak bisa dilakukan.',
            },
            {
              value: 'both',
              label: 'Keduanya',
              description: 'Backend menerima kedua cara; layar teller aplikasi ini tetap memakai persetujuan di aplikasi nasabah.',
            },
          ]}
        />
        {verification === 'terminal' && (
          <Alert tone="warning" title="Penarikan di loket akan terhenti">
            Dengan pilihan ini teller tidak dapat mengirim permintaan ke aplikasi nasabah, dan layar teller tidak memiliki
            kolom PIN.
          </Alert>
        )}
      </Panel>

      {mutation.isSuccess && !changed && (
        <Alert tone="success" title="Pengaturan disimpan">
          Berlaku untuk transaksi berikutnya di semua loket.
        </Alert>
      )}
      {mutation.error && !fieldError && <Alert title="Pengaturan tidak disimpan">{mutation.error.message}</Alert>}

      <div className="flex gap-2">
        <Button type="submit" loading={mutation.isPending} disabled={!changed}>
          Simpan pengaturan
        </Button>
      </div>
    </form>
  )
}

/** Global settings the teller screens follow: minimum balance, QR scanner, withdrawal verification. */
export function SettingsPage() {
  const settings = useSettings()
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title="Pengaturan" description="Berlaku untuk semua teller dan nasabah." />
      {settings.isPending ? (
        <Loading />
      ) : settings.error ? (
        <LoadError error={settings.error} onRetry={() => void settings.refetch()} />
      ) : (
        <SettingsForm current={settings.data} />
      )}
    </div>
  )
}
