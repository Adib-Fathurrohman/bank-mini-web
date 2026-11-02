import { describe, expect, it } from 'vitest'
import { appState } from './labels'

describe('appState', () => {
  it('needs activation first, then a PIN created in the app', () => {
    expect(appState({ activation_status: 'pending', pin_set: false })).toBe('pending')
    expect(appState({ activation_status: 'activated', pin_set: false })).toBe('noPin')
    expect(appState({ activation_status: 'activated', pin_set: true })).toBe('ready')
  })
})
