import { describe, expect, it } from 'vitest'
import { groupCustomerImportErrors, groupImportErrors } from './importErrors'

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

describe('groupCustomerImportErrors', () => {
  it('separates customer rows from history rows and drops the backend cell names', () => {
    const { rows, transactions, general } = groupCustomerImportErrors({
      'rows.0.nis': ['The nis (baris 2) has already been taken.'],
      'rows.2.major': ['major (baris 4) tidak dikenal. Gunakan kode atau nama jurusan yang terdaftar.'],
      'rows.1.balance': ['Saldo nasabah 20260002 (baris 3) lebih kecil dari hasil riwayat transaksinya (Rp50.000).'],
      'transactions.0.type': ['type (transaksi baris 2) harus setor atau tarik.'],
      'transactions.4.amount': ['Saldo nasabah 20260002 menjadi minus pada transaksi baris 6.'],
      rows: ['The rows field is required.'],
    })
    expect(rows).toEqual([
      { row: 2, messages: ['NIS: Sudah digunakan.'] },
      { row: 3, messages: ['Saldo: Saldo nasabah 20260002 lebih kecil dari hasil riwayat transaksinya (Rp50.000).'] },
      { row: 4, messages: ['Jurusan: tidak dikenal. Gunakan kode atau nama jurusan yang terdaftar.'] },
    ])
    expect(transactions).toEqual([
      { row: 2, messages: ['Jenis: harus setor atau tarik.'] },
      { row: 6, messages: ['Nominal: Saldo nasabah 20260002 menjadi minus pada transaksi baris 6.'] },
    ])
    expect(general).toEqual(['Wajib diisi.'])
  })
})
