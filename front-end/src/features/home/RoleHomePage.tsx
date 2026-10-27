import { useCurrentUser } from '@/auth/context'
import { ROLE_LABEL } from '@/auth/session'
import type { StaffRole } from '@/api/types'

// Placeholder home pages until each role's phase lands (docs/FRONTEND_AUDIT.md §9).
const NEXT_STEP: Record<StaffRole, string> = {
  teller: 'Layanan teller (buka shift, setor, tarik, koreksi, tutup shift) dibangun pada Fase 1.',
  supervisor: 'Verifikasi laporan harian dan buku kas brankas dibangun pada Fase 2.',
  admin: 'Pengelolaan staf, rekening nasabah, dan pengaturan dibangun pada Fase 4.',
}

export function RoleHomePage() {
  const user = useCurrentUser()

  return (
    <section className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Selamat datang, {user.full_name}</h1>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <dt className="text-slate-500">Peran</dt>
        <dd className="font-medium text-slate-900">{ROLE_LABEL[user.role]}</dd>
        <dt className="text-slate-500">Username</dt>
        <dd className="font-medium text-slate-900">{user.username}</dd>
        {user.class && (
          <>
            <dt className="text-slate-500">Kelas</dt>
            <dd className="font-medium text-slate-900">{user.class}</dd>
          </>
        )}
      </dl>
      <p className="mt-4 text-sm text-slate-600">{NEXT_STEP[user.role]}</p>
    </section>
  )
}
