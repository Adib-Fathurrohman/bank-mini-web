import type { ApiError } from '@/api/errors'
import type { CustomerClass, CustomerGroup } from '@/api/types'

/** "kelas XII RPL 2" from the scope the admin picked (major name lookup is done by the caller). */
export function scopeLabel(klass: CustomerClass, major: string | null, group: CustomerGroup | null): string {
  return ['kelas', klass, major, group].filter(Boolean).join(' ')
}

/** What the admin sees for the refusals of the graduation and the class promotion runs. */
export function runErrorMessage(error: ApiError): { message: string; reload: boolean } {
  switch (error.code) {
    case 'graduation_selection_changed':
    case 'promotion_selection_changed':
      return { message: 'Data berubah sejak pratinjau dibuat. Muat ulang pratinjau, periksa daftarnya, lalu ulangi.', reload: true }
    case 'graduation_empty':
      return { message: 'Tidak ada rekening aktif pada kelas yang dipilih. Tidak ada yang diluluskan.', reload: true }
    case 'promotion_empty':
      return { message: 'Tidak ada rekening aktif di kelas X atau XI.', reload: true }
    case 'promotion_xii_not_empty':
      return { message: 'Proses kelulusan kelas XII terlebih dahulu, baru jalankan kenaikan kelas.', reload: true }
    case 'promotion_already_done':
      return { message: error.message, reload: true }
    default:
      return { message: error.message, reload: false }
  }
}

/** Why the class promotion cannot run now (null when it can). */
export function promotionBlockedReason(summary: {
  open_xii_count: number
  already_done: boolean
  school_year: string
  x_count: number
  xi_count: number
}): { kind: 'xii' | 'done' | 'empty'; message: string } | null {
  if (summary.open_xii_count > 0) {
    return {
      kind: 'xii',
      message: `Masih ada ${summary.open_xii_count} rekening kelas XII yang terbuka. Proses kelulusan kelas XII terlebih dahulu.`,
    }
  }
  if (summary.already_done) {
    return { kind: 'done', message: `Kenaikan kelas tahun ajaran ${summary.school_year} sudah dijalankan.` }
  }
  if (summary.x_count + summary.xi_count === 0) {
    return { kind: 'empty', message: 'Tidak ada rekening aktif di kelas X atau XI.' }
  }
  return null
}
