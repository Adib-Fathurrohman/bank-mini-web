// API timestamps are UTC ISO strings; display them in Asia/Jakarta (WIB).
// API dates (`report_date`, filters) are plain `YYYY-MM-DD` in Asia/Jakarta.

export const TIME_ZONE = 'Asia/Jakarta'

const dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const timeFormat = new Intl.DateTimeFormat('id-ID', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' })

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC', // the input is already a calendar date; do not shift it
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** `2026-10-27T13:10:36.000000Z` → `27 Okt 2026, 20.10 WIB` */
export function formatDateTime(iso: string): string {
  return `${dateTimeFormat.format(new Date(iso))} WIB`
}

/** `2026-10-27T13:10:36.000000Z` → `20.10` */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso))
}

/** `2026-10-27` → `Selasa, 27 Oktober 2026` */
export function formatDate(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number)
  return dateFormat.format(new Date(Date.UTC(year!, month! - 1, day!)))
}

/** Today's date in Asia/Jakarta as `YYYY-MM-DD`. Prefer server flags (`can_transact`) over this for business decisions. */
export function jakartaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now)
}

/** True while an ISO timestamp (e.g. `pin_locked_until`) is in the future. */
export function isInFuture(iso: string | null | undefined, now: Date = new Date()): boolean {
  return iso != null && new Date(iso).getTime() > now.getTime()
}
