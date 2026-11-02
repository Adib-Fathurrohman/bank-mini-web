import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { openShift } from '@/api/endpoints/teller'
import type { ApiError } from '@/api/errors'
import { useCurrentUser } from '@/auth/context'
import { Alert } from '@/components/Alert'
import { Amount } from '@/components/Amount'
import { Button } from '@/components/Button'
import { DataList, DataRow } from '@/components/DataList'
import { Dialog, DialogActions } from '@/components/Dialog'
import { Eyebrow, PageHeader, Panel } from '@/components/Page'
import { formatDate, jakartaToday } from '@/lib/datetime'
import { DENOMINATIONS, toDenominationsPayload, totalOfCounts, type DenominationCounts } from '@/lib/denominations'
import { formatRupiah } from '@/lib/money'
import { terbilangRupiah } from '@/lib/terbilang'
import { DenominationCounter } from './components/DenominationCounter'
import { useRefreshTeller } from './queries'

/** T1: count the drawer per denomination, confirm, and open today's shift. */
export function OpenShiftForm() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const refresh = useRefreshTeller()
  const [counts, setCounts] = useState<DenominationCounts>({})
  const [confirming, setConfirming] = useState(false)
  const mutation = useMutation<unknown, ApiError>({
    mutationFn: () => openShift(toDenominationsPayload(counts)),
    onSuccess: async () => {
      await refresh()
      navigate('/teller/counter')
    },
    // A refused open usually means the shift state changed (e.g. opened in another tab).
    onError: () => void refresh(),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.reset()
    setConfirming(true)
  }

  const error = mutation.error
  const total = totalOfCounts(counts)
  const pieces = DENOMINATIONS.reduce((sum, d) => sum + (counts[d] ?? 0), 0)
  const today = formatDate(jakartaToday())

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Buka shift"
        description="Hitung uang di laci kas per pecahan. Totalnya menjadi saldo awal shift hari ini dan dicocokkan saat shift ditutup."
      />

      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel className="px-4 pt-2 pb-4 sm:px-5">
          <DenominationCounter counts={counts} onChange={setCounts} disabled={mutation.isPending} />
          <p className="mt-4 text-xs text-ink-500">
            Tekan Enter atau ↓ untuk pindah ke pecahan berikutnya.
          </p>
        </Panel>

        <Panel className="flex flex-col gap-4 p-4 sm:p-5 lg:sticky lg:top-6">
          <div>
            <Eyebrow>Saldo awal</Eyebrow>
            <Amount value={total} size="xl" className="mt-1 block" />
            <p className="mt-1 text-[13px] text-ink-500 first-letter:uppercase">{terbilangRupiah(total)}</p>
          </div>
          <DataList className="border-t border-ink-200">
            <DataRow label="Tanggal">{today}</DataRow>
            <DataRow label="Teller">{user.full_name}</DataRow>
            <DataRow label="Lembar/keping">{pieces}</DataRow>
          </DataList>
          {error && !confirming && <Alert>{error.fieldUnder('denominations') ?? error.message}</Alert>}
          <Button type="submit" size="lg" className="w-full">
            Buka shift
          </Button>
        </Panel>
      </form>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        dismissable={!mutation.isPending}
        title="Buka shift hari ini?"
        description="Saldo awal dicatat sesuai hitungan ini."
        size="sm"
      >
        <div className="rounded-lg bg-ink-50 px-4 py-3 text-center">
          <Amount value={total} size="lg" />
          <p className="mt-0.5 text-[13px] text-ink-500 first-letter:uppercase">{terbilangRupiah(total)}</p>
        </div>
        <DataList>
          <DataRow label="Tanggal">{today}</DataRow>
          <DataRow label="Lembar/keping">{pieces}</DataRow>
          <DataRow label="Saldo awal" strong>
            {formatRupiah(total)}
          </DataRow>
        </DataList>
        {error && <Alert>{error.fieldUnder('denominations') ?? error.message}</Alert>}
        <DialogActions>
          <Button variant="secondary" disabled={mutation.isPending} onClick={() => setConfirming(false)}>
            Hitung ulang
          </Button>
          <Button data-autofocus loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Buka shift
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
