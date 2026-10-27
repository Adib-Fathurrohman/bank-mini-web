import { api } from '../client'
import type { LoginResponse, MessageResponse, Single, Staff } from '../types'

export function login(username: string, password: string) {
  return api.post<LoginResponse>('/login', { username, password }, { auth: false })
}

export function fetchMe() {
  return api.get<Single<Staff>>('/staff/me')
}

/** Revokes the current staff token. Never reports a lost session: we are logging out anyway. */
export function logout(token: string) {
  return api.post<MessageResponse>('/staff/logout', undefined, { auth: token })
}

/** Revokes a customer token that was issued to the web app by mistake. */
export function revokeCustomerToken(token: string) {
  return api.post<MessageResponse>('/customer/logout', undefined, { auth: token })
}
