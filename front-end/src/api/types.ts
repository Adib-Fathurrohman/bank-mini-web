// API contract types, taken from bank-mini-laravel/docs (DATA_MODEL.md, API.md).
// Money is integer Rupiah; timestamps are UTC ISO strings; dates are YYYY-MM-DD
// in Asia/Jakarta. Relations that the backend omits when not loaded are optional.

export type StaffRole = 'admin' | 'supervisor' | 'teller'
export type AccountStatus = 'active' | 'suspended' | 'inactive'
export type CustomerClass = 'X' | 'XI' | 'XII'
export type CustomerGroup = '1' | '2' | '3' | '4'
export type TransactionType = 'deposit' | 'withdrawal' | 'deposit_correction' | 'withdrawal_correction'
export type DailyReportStatus = 'open' | 'submitted' | 'on_hold' | 'approved' | 'rejected'
export type QrScannerMode = 'webcam' | 'usb' | 'disabled'

export interface Staff {
  id: number
  username: string
  full_name: string
  class: string | null
  phone: string | null
  role: StaffRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Major {
  id: number
  code: string
  major_name: string
}

export interface Customer {
  id: number
  account_number: string
  nis: string
  full_name: string
  class: CustomerClass
  group: CustomerGroup
  major: Major
  account_status: AccountStatus
  balance: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** `GET /teller/customers/lookup` */
export interface CustomerSummary {
  id: number
  account_number: string
  nis: string
  full_name: string
  class: CustomerClass
  group: CustomerGroup
  major_name: string
  account_status: AccountStatus
  balance: number
  pin_locked_until: string | null
}

export interface PersonRef {
  id: number
  full_name: string
}

export interface Transaction {
  id: number
  type: TransactionType
  type_label: string
  amount: number
  amount_in_words: string
  balance_before: number
  balance_after: number
  created_at: string
  daily_report_id: number
  corrects_transaction_id: number | null
  note: string | null
  customer: { id: number; account_number: string; full_name: string }
  /** Only when the endpoint loads it (e.g. `GET /teller/transactions`), never on `GET /teller/shift`. */
  corrected_by?: { id: number; type: TransactionType; created_at: string } | null
  authorized_by?: PersonRef | null
  teller?: PersonRef
}

export interface CashCount {
  denomination: number
  quantity: number
  subtotal: number
}

export interface DailyReport {
  id: number
  report_date: string
  status: DailyReportStatus
  opening_balance: number
  opened_at: string | null
  transaction_count: number
  total_deposit: number
  total_withdrawal: number
  system_balance: number | null
  physical_balance: number | null
  difference: number | null
  submitted_at: string | null
  reviewed_at: string | null
  supervisor_note: string | null
  teller?: PersonRef & { class: string | null }
  supervisor?: PersonRef | null
  opening_counts?: CashCount[]
  closing_counts?: CashCount[]
  cash_transfer?: { id: number; amount: number; transferred_at: string } | null
}

/** `GET /teller/shift` */
export type ShiftState =
  | { data: DailyReport; can_transact: boolean; transactions: Transaction[] }
  | { data: null; can_transact: false; closed_today: boolean }

export interface Settings {
  min_balance: number
  qr_scanner_mode: QrScannerMode
}

export interface Paginated<T> {
  data: T[]
  links: { first: string | null; last: string | null; prev: string | null; next: string | null }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    path: string
    per_page: number
    to: number | null
    total: number
  }
}

export interface Single<T> {
  data: T
}

export type LoginResponse = Single<
  | { actor: 'staff'; token: string; token_type: 'Bearer'; user: Staff }
  | { actor: 'customer'; token: string; token_type: 'Bearer'; customer: Customer }
>

export interface MessageResponse {
  message: string
}
