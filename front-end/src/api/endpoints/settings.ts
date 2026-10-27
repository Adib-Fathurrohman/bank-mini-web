import { api } from '../client'
import type { Major, Settings, Single } from '../types'

export function fetchSettings() {
  return api.get<Single<Settings>>('/settings')
}

export function fetchMajors() {
  return api.get<Single<Major[]>>('/majors')
}
