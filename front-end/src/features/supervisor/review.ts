import type { ReviewDecision } from '@/api/endpoints/supervisor'
import type { DailyReportStatus } from '@/api/types'

// Review rules (API.md "Supervisor: daily reports"): approve from submitted or
// on_hold, hold only from submitted, reject from submitted or on_hold. The
// backend enforces the same and answers 422 otherwise.

export const NOTE_MAX = 1000

export function awaitingReview(status: DailyReportStatus): boolean {
  return status === 'submitted' || status === 'on_hold'
}

export function allowedDecisions(status: DailyReportStatus): ReviewDecision[] {
  if (status === 'submitted') return ['approve', 'hold', 'reject']
  if (status === 'on_hold') return ['approve', 'reject']
  return []
}

/** Hold and reject must explain why; the note is shown to the teller. */
export function validateNote(decision: ReviewDecision, note: string): string | null {
  const trimmed = note.trim()
  if (decision !== 'approve' && trimmed === '') {
    return decision === 'hold' ? 'Tulis alasan laporan ditahan.' : 'Tulis alasan laporan ditolak agar teller tahu apa yang harus diperbaiki.'
  }
  if (trimmed.length > NOTE_MAX) return `Catatan maksimal ${NOTE_MAX} karakter.`
  return null
}

export const DECISION_DONE: Record<ReviewDecision, string> = {
  approve: 'Laporan disetujui',
  hold: 'Laporan ditahan',
  reject: 'Laporan ditolak',
}
