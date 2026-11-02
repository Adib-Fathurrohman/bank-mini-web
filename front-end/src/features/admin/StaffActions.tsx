import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { deleteStaff, setStaffBlocked } from '@/api/endpoints/admin'
import type { ApiError } from '@/api/errors'
import type { Staff } from '@/api/types'
import { Alert } from '@/components/Alert'
import { Button, buttonClass } from '@/components/Button'
import { Dialog, DialogActions } from '@/components/Dialog'
import type { Flash } from '@/lib/flash'
import { useRefreshDirectory } from './queries'

/**
 * Admin actions on a teller or supervisor: edit, block/unblock, delete. Delete
 * only works for accounts that were never used (409 otherwise); then blocking is offered.
 */
export function StaffActions({ staff }: { staff: Staff }) {
  const navigate = useNavigate()
  const refresh = useRefreshDirectory()
  const [open, setOpen] = useState<'block' | 'delete' | null>(null)
  const blockInsteadRef = useRef<HTMLButtonElement>(null)

  const block = useMutation<Staff, ApiError, boolean>({
    mutationFn: async (blocked) => (await setStaffBlocked(staff.id, blocked)).data,
    onSuccess: () => {
      setOpen(null)
      void refresh()
    },
  })
  const remove = useMutation<unknown, ApiError>({
    mutationFn: () => deleteStaff(staff.id),
    onSuccess: () => {
      void refresh()
      navigate('/staff', { state: { flash: `Akun ${staff.username} dihapus.` } satisfies Flash })
    },
  })

  const pending = block.isPending || remove.isPending
  const refused = remove.error?.kind === 'conflict'

  // The delete button is replaced by "Blokir saja"; keep keyboard focus in the dialog.
  useEffect(() => {
    if (refused) blockInsteadRef.current?.focus()
  }, [refused])
  const close = () => {
    if (pending) return
    setOpen(null)
    block.reset()
    remove.reset()
  }

  return (
    <>
      <Link to={`/staff/${staff.id}/edit`} className={buttonClass('secondary')}>
        Ubah
      </Link>
      {staff.is_active ? (
        <Button variant="secondary" onClick={() => setOpen('block')}>
          Blokir
        </Button>
      ) : (
        <Button variant="secondary" loading={block.isPending} onClick={() => block.mutate(false)}>
          Buka blokir
        </Button>
      )}
      <Button variant="ghost" onClick={() => setOpen('delete')}>
        Hapus
      </Button>
      {block.error && open === null && <Alert className="w-full">{block.error.message}</Alert>}

      <Dialog
        open={open === 'block'}
        onClose={close}
        dismissable={!pending}
        size="sm"
        title={`Blokir ${staff.full_name}?`}
        description="Staf tidak dapat masuk dan sesi yang sedang berjalan diakhiri. Riwayat transaksinya tetap tersimpan. Blokir dapat dibuka lagi."
      >
        {block.error && <Alert>{block.error.message}</Alert>}
        <DialogActions>
          <Button variant="secondary" disabled={pending} onClick={close}>
            Batal
          </Button>
          <Button data-autofocus variant="danger" loading={block.isPending} onClick={() => block.mutate(true)}>
            Blokir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={open === 'delete'}
        onClose={close}
        dismissable={!pending}
        size="sm"
        title={`Hapus ${staff.full_name}?`}
        description="Hanya untuk akun yang belum pernah dipakai. Akun dihapus permanen."
      >
        {remove.error?.kind === 'conflict' ? (
          <Alert tone="warning" title="Akun tidak dapat dihapus">
            {remove.error.message}
          </Alert>
        ) : (
          remove.error && <Alert>{remove.error.message}</Alert>
        )}
        <DialogActions>
          <Button variant="secondary" disabled={pending} onClick={close}>
            Batal
          </Button>
          {remove.error?.kind === 'conflict' ? (
            staff.is_active && (
              <Button ref={blockInsteadRef} variant="danger" loading={block.isPending} onClick={() => block.mutate(true)}>
                Blokir saja
              </Button>
            )
          ) : (
            <Button data-autofocus variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
              Hapus permanen
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}
