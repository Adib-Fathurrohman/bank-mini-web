import { useCurrentUser } from '@/auth/context'
import { ROLE_LABEL } from '@/auth/session'
import type { StaffRole } from '@/api/types'
import { DataList, DataRow } from '@/components/DataList'
import { PageHeader, Panel } from '@/components/Page'

// Placeholder home pages until each role's phase lands (docs/FRONTEND_AUDIT.md §9).
const NEXT_STEP: Partial<Record<StaffRole, string>> = {
  supervisor: 'Verifikasi laporan harian dan buku kas brankas dibangun pada Fase 2.',
  admin: 'Pengelolaan staf, rekening nasabah, dan pengaturan dibangun pada Fase 4.',
}

export function RoleHomePage() {
  const user = useCurrentUser()

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={`Selamat datang, ${user.full_name}`} description={NEXT_STEP[user.role]} />
      <Panel className="px-4">
        <DataList>
          <DataRow label="Peran">{ROLE_LABEL[user.role]}</DataRow>
          <DataRow label="Username" mono>
            {user.username}
          </DataRow>
          {user.class && <DataRow label="Kelas">{user.class}</DataRow>}
        </DataList>
      </Panel>
    </div>
  )
}
