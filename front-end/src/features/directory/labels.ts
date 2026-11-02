import type { AccountStatus, ActivationStatus, Customer, CustomerClass, CustomerGroup } from '@/api/types'
import type { BadgeTone } from '@/components/Badge'

export { ACCOUNT_STATUS_LABEL, APP_STATE_LABEL, APP_STATE_TONE, appState } from '@/features/teller/labels'

export const ACCOUNT_STATUS_TONE: Record<AccountStatus, BadgeTone> = {
  active: 'success',
  suspended: 'warning',
  inactive: 'neutral',
}

/** Filter options: `activated` includes students who have not created their PIN yet. */
export const ACTIVATION_LABEL: Record<ActivationStatus, string> = {
  pending: 'Belum aktivasi',
  activated: 'Sudah aktivasi',
}

export const CLASSES: CustomerClass[] = ['X', 'XI', 'XII']
export const GROUPS: CustomerGroup[] = ['1', '2', '3', '4']

/** `XI · RPL 2`: grade, major code and group as the school writes it. */
export function classLabel(customer: Pick<Customer, 'class' | 'group' | 'major'>): string {
  return `${customer.class} · ${customer.major.code} ${customer.group}`
}
