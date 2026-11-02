import { useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { deactivateCustomer, resetCustomerPin } from '@/api/endpoints/admin'
import type { ApiError } from '@/api/errors'
import type { Customer } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Dialog, DialogActions } from '@/components/Dialog'
import { TextField } from '@/components/TextField'
import { formatRupiah } from '@/lib/money'
import { useRefreshDirectory } from './queries'

/** Strong confirmation for closing one account: typing the account number, with a warning while money remains. */
export function GraduateDialog({ customer, open, onClose }: { customer: Customer; open: boolean; onClose: () => void }) {
  const confirmId = useId()
  const refresh = useRefreshDirectory()
  const [typed, setTyped] = useState('')
  const mutation = useMutation<Customer, ApiError>({
    mutationFn: async () => (await deactivateCustomer(customer.id)).data,
    onSuccess: () => {
      void refresh()
      onClose()
    },
  })
  const matches = typed.trim().toUpperCase() === customer.account_number.toUpperCase()

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (mutation.isPending) return
        setTyped('')
        mutation.reset()
        onClose()
      }}
      dismissable={!mutation.isPending}
      size="sm"
      title="Luluskan dan tutup rekening?"
      description="Rekening dinonaktifkan dan disembunyikan dari daftar. Riwayat tetap tersimpan. Tindakan ini tidak dapat dibatalkan."
    >
      <DataList>
        <DataRow label="Nasabah">{customer.full_name}</DataRow>
        <DataRow label="Rekening" mono>
          {customer.account_number}
        </DataRow>
        <DataRow label="Saldo" strong>
          {formatRupiah(customer.balance)}
        </DataRow>
      </DataList>
      {customer.balance > 0 && (
        <Alert tone="warning" title={`Saldo masih ${formatRupiah(customer.balance)}`}>
          Setelah ditutup saldo tidak dapat ditarik lagi. Minta siswa menarik saldonya di loket terlebih dahulu; sisa sebesar
          saldo minimum tetap tertinggal.
        </Alert>
      )}
      <TextField
        id={confirmId}
        label={`Ketik ${customer.account_number} untuk konfirmasi`}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        data-autofocus
        inputClassName="font-mono"
        disabled={mutation.isPending}
      />
      {mutation.error && <Alert>{mutation.error.message}</Alert>}
      <DialogActions>
        <Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>
          Batal
        </Button>
        <Button variant="danger" disabled={!matches} loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Luluskan dan tutup
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/** Forgotten PIN: remove it so the student creates a new one in the app. No PIN is typed here. */
function ResetPinDialog({ customer, open, onClose }: { customer: Customer; open: boolean; onClose: () => void }) {
  const refresh = useRefreshDirectory()
  const mutation = useMutation<string, ApiError>({
    mutationFn: async () => (await resetCustomerPin(customer.id)).message,
    onSuccess: () => void refresh(),
  })

  function close() {
    if (mutation.isPending) return
    mutation.reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      dismissable={!mutation.isPending}
      size="sm"
      title={mutation.isSuccess ? 'PIN direset' : 'Reset PIN nasabah?'}
      description={
        mutation.isSuccess
          ? undefined
          : 'PIN dan blokir PIN dihapus. Siswa membuat PIN baru di aplikasi Bank Mini; sampai saat itu penarikan tidak dapat dilakukan.'
      }
    >
      <DataList>
        <DataRow label="Nasabah">{customer.full_name}</DataRow>
        <DataRow label="Rekening" mono>
          {customer.account_number}
        </DataRow>
      </DataList>
      {mutation.isSuccess && <Alert tone="success">{mutation.data}</Alert>}
      {mutation.error && <Alert>{mutation.error.message}</Alert>}
      <DialogActions>
        {mutation.isSuccess ? (
          <Button onClick={close} data-autofocus>
            Selesai
          </Button>
        ) : (
          <>
            <Button variant="secondary" disabled={mutation.isPending} onClick={close}>
              Batal
            </Button>
            <Button variant="danger" loading={mutation.isPending} onClick={() => mutation.mutate()} data-autofocus>
              Reset PIN
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

/** Admin actions on an open account: edit (incl. suspend), card, PIN reset, graduation. */
export function CustomerActions({ customer }: { customer: Customer }) {
  const [graduating, setGraduating] = useState(false)
  const [resettingPin, setResettingPin] = useState(false)

  return (
    <>
      <Link to={`/customers/${customer.id}/edit`} className={buttonClass('primary')}>
        Ubah
      </Link>
      <Link to={`/customers/${customer.id}/card`} className={buttonClass('secondary')}>
        Cetak kartu
      </Link>
      {customer.pin_set && (
        <Button variant="secondary" icon="lock" onClick={() => setResettingPin(true)}>
          Reset PIN
        </Button>
      )}
      <Button variant="ghost" onClick={() => setGraduating(true)}>
        Luluskan
      </Button>
      <ResetPinDialog customer={customer} open={resettingPin} onClose={() => setResettingPin(false)} />
      <GraduateDialog customer={customer} open={graduating} onClose={() => setGraduating(false)} />
    </>
  )
}
