import type { Customer } from '@/api/types'
import { Alert } from '@/components/Alert'
import { appState } from './labels'

/**
 * What the student still has to do in the Bank Mini app before a withdrawal
 * can be approved. The backend sends no email, so staff tell the student in
 * person. Nothing is shown once the app is ready or while there is no email
 * (the page asks for one separately).
 */
export function AppStatusNotice({ customer }: { customer: Customer }) {
  const state = appState(customer)
  if (state === 'ready' || customer.email === null) return null

  if (state === 'noPin') {
    return (
      <Alert tone="warning" title="PIN belum dibuat">
        Siswa sudah mengaktifkan aplikasi tetapi belum membuat PIN, atau PIN-nya baru direset. Penarikan belum dapat
        dilakukan sampai siswa membuat PIN di aplikasi Bank Mini.
      </Alert>
    )
  }

  return (
    <Alert tone="info" title="Langkah untuk siswa">
      <ol className="mt-1 list-decimal space-y-0.5 pl-5">
        <li>Pasang aplikasi Bank Mini.</li>
        <li>
          Masuk dengan Google atau email <span className="font-medium">{customer.email}</span>.
        </li>
        <li>Isi NIS {customer.nis}, lalu buat PIN 6 digit.</li>
      </ol>
      <p className="mt-1.5">Setor tunai sudah bisa sekarang; penarikan bisa setelah PIN dibuat.</p>
    </Alert>
  )
}
