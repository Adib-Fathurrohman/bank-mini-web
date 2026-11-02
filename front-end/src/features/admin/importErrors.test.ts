import { describe, expect, it } from 'vitest'
import { groupImportErrors } from './importErrors'

describe('groupImportErrors', () => {
  it('groups errors by spreadsheet row (index 0 is row 2) and translates them', () => {
    const { rows, general } = groupImportErrors({
      'rows.3.username': ['The username (baris 5) has already been taken.'],
      'rows.0.full_name': ['The full name (baris 2) field is required.'],
      'rows.0.password': ['The password (baris 2) field must be at least 8 characters.'],
    })
    expect(general).toEqual([])
    expect(rows).toEqual([
      { row: 2, messages: ['Nama: Wajib diisi.', 'Password: Minimal 8 karakter.'] },
      { row: 5, messages: ['Username: Sudah digunakan.'] },
    ])
  })

  it('keeps errors about the file itself separate', () => {
    const { rows, general } = groupImportErrors({ file: ['The file field is required.'] })
    expect(rows).toEqual([])
    expect(general).toEqual(['Wajib diisi.'])
  })
})
