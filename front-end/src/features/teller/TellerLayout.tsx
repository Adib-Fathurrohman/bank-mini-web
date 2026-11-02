import { AppShell } from '@/layouts/AppShell'
import { ShiftStatusBlock, ShiftStatusPill } from './components/ShiftStatus'

/** Teller shell: the shift state is part of the chrome on every teller page. */
export function TellerLayout() {
  return <AppShell status={<ShiftStatusBlock />} compactStatus={<ShiftStatusPill />} />
}
