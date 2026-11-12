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

// Staff email and password (backend v0.3.0, API.md "Staff email and password").

/**
 * Sets, changes (`email`) or removes (`null`) the own email; needs the current password.
 * A new address gets a verification link and stays unverified until it is opened.
 */
export function updateOwnEmail(email: string | null, currentPassword: string) {
  return api.put<Single<Staff>>('/staff/email', { email, current_password: currentPassword })
}

/** 422 `email_missing`, 409 `email_already_verified`. */
export function resendEmailVerification() {
  return api.post<MessageResponse>('/staff/email/verification-notification')
}

/** Other devices are logged out; this session continues. 422 `current_password_invalid`. */
export function changeOwnPassword(body: { current_password: string; password: string; password_confirmation: string }) {
  return api.post<MessageResponse>('/staff/password', body)
}

/** Public. 202 with the same message for any email. */
export function requestPasswordReset(email: string) {
  return api.post<MessageResponse>('/staff/password/forgot', { email }, { auth: false })
}

/** Public. 422 `password_reset_invalid` for an unknown email or a wrong, used or expired token. */
export function resetPassword(body: { email: string; token: string; password: string; password_confirmation: string }) {
  return api.post<MessageResponse>('/staff/password/reset', body, { auth: false })
}
