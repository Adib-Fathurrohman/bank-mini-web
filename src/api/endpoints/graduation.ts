import { api, requestBlob } from '../client'
import type {
  ClassPromotion,
  ClassPromotionPreview,
  CustomerClass,
  CustomerGroup,
  Graduation,
  GraduationPreview,
  Paginated,
  Single,
} from '../types'

// Graduation (kelulusan) and class promotion (kenaikan kelas), backend v0.3.0
// (API.md "Graduation" and "Kenaikan kelas"). Preview and execute are the
// administrator's; the history and the slips are also readable by supervisors.

export interface GraduationScope {
  class: CustomerClass
  major_id?: number
  group?: CustomerGroup
}

/** The open accounts of the class and what each receives. Changes nothing. */
export function previewGraduation(scope: GraduationScope) {
  return api.get<GraduationPreview>('/admin/graduations/preview', { query: { ...scope } })
}

/**
 * Pays out and closes exactly the accounts of the preview, all or nothing.
 * 409 `graduation_selection_changed` when the class changed since the preview.
 */
export function executeGraduation(body: GraduationScope & { customer_ids: number[]; note?: string }) {
  return api.post<Single<Graduation>>('/admin/graduations', body)
}

export function fetchGraduations(page: number) {
  return api.get<Paginated<Graduation>>('/graduations', { query: { page } })
}

export function fetchGraduation(id: string) {
  return api.get<Single<Graduation>>(`/graduations/${encodeURIComponent(id)}`)
}

/** One PDF, one page per student who received money. */
export function fetchGraduationSlips(id: string) {
  return requestBlob(`/graduations/${encodeURIComponent(id)}/slips`)
}

/** One student's slip, for a reprint. */
export function fetchGraduationSlip(id: string, customerId: number) {
  return requestBlob(`/graduations/${encodeURIComponent(id)}/slips/${customerId}`)
}

export function previewClassPromotion() {
  return api.get<ClassPromotionPreview>('/admin/class-promotions/preview')
}

/**
 * Moves every listed account up one class, except `retained_customer_ids` (tinggal kelas).
 * `customer_ids` is every id of the preview. 409: `promotion_xii_not_empty`,
 * `promotion_already_done`, `promotion_selection_changed`.
 */
export function executeClassPromotion(body: { customer_ids: number[]; retained_customer_ids: number[]; note?: string }) {
  return api.post<Single<ClassPromotion>>('/admin/class-promotions', body)
}

export function fetchClassPromotions(page: number) {
  return api.get<Paginated<ClassPromotion>>('/class-promotions', { query: { page } })
}

export function fetchClassPromotion(id: string) {
  return api.get<Single<ClassPromotion>>(`/class-promotions/${encodeURIComponent(id)}`)
}
