/** Client-side check of a new PIN set by the admin; the backend repeats the 6-digit rule. */
export function validateNewPin(pin: string, confirmation: string): { pin?: string; confirmation?: string } {
  if (!/^\d{6}$/.test(pin)) return { pin: 'PIN harus 6 digit angka.' }
  if (pin !== confirmation) return { confirmation: 'PIN tidak sama.' }
  return {}
}
