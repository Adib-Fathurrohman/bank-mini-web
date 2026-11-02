import { useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { deactivateCustomer, resendInvitation } from '@/api/endpoints/admin'
import type { ApiError } from '@/api/errors'
import type { Customer, Invitation } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Dialog, DialogActions } from '@/components/Dialog'
import { TextField } from '@/components/TextField'
import { formatDateTime } from '@/lib/datetime'
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

/** Admin actions on an open account: edit (incl. PIN reset and suspend), card, invitation, graduation. */
export function CustomerActions({ customer }: { customer: Customer }) {
  const [graduating, setGraduating] = useState(false)
  const invite = useMutation<Invitation, ApiError>({
    mutationFn: async () => (await resendInvitation(customer.id)).data,
  })
  const canInvite = customer.activation_status === 'pending' && customer.email !== null

  return (
    <>
      <Link to={`/customers/${customer.id}/edit`} className={buttonClass('primary')}>
        Ubah
      </Link>
      <Link to={`/customers/${customer.id}/card`} className={buttonClass('secondary')}>
        Cetak kartu
      </Link>
      {canInvite && (
        <Button variant="secondary" icon="mail" loading={invite.isPending} onClick={() => invite.mutate()}>
          Kirim ulang undangan
        </Button>
      )}
      <Button variant="ghost" onClick={() => setGraduating(true)}>
        Luluskan
      </Button>
      {invite.data && (
        <Alert tone={invite.data.mail_sent ? 'success' : 'warning'} className="w-full" title={invite.data.mail_sent ? 'Undangan terkirim' : 'Email gagal terkirim'}>
          {invite.data.mail_sent
            ? `Link baru dikirim ke ${invite.data.sent_to}, berlaku sampai ${formatDateTime(invite.data.expires_at)}. Link sebelumnya tidak berlaku lagi.`
            : 'Coba lagi beberapa saat lagi.'}
        </Alert>
      )}
      {invite.error && <Alert className="w-full">{invite.error.message}</Alert>}
      <GraduateDialog customer={customer} open={graduating} onClose={() => setGraduating(false)} />
    </>
  )
}
