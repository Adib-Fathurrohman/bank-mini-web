// API contract types, taken from bank-mini-laravel/docs (DATA_MODEL.md, API.md).
// Money is integer Rupiah; timestamps are UTC ISO strings; dates are YYYY-MM-DD
// in Asia/Jakarta. Relations that the backend omits when not loaded are optional.

export type StaffRole = 'admin' | 'supervisor' | 'teller'
export type AccountStatus = 'active' | 'suspended' | 'inactive'
export type CustomerClass = 'X' | 'XI' | 'XII'
export type CustomerGroup = '1' | '2' | '3' | '4'
export type TransactionType = 'deposit' | 'withdrawal' | 'deposit_correction' | 'withdrawal_correction'
export type DailyReportStatus = 'open' | 'submitted' | 'on_hold' | 'approved' | 'rejected'
export type ActivationStatus = 'pending' | 'activated'
export type AccountCode = '101' | '201'
export type JournalPosition = 'debit' | 'credit'
export type QrScannerMode = 'webcam' | 'usb' | 'disabled'
/** How a customer authorizes a withdrawal: in the mobile app (Mode A), at the terminal (Mode B), or either. */
export type WithdrawalVerification = 'mobile' | 'terminal' | 'both'
export type WithdrawalAuthorizationStatus = 'pending' | 'approved' | 'consumed' | 'rejected' | 'cancelled' | 'expired'

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
  /** Registered email the student signs in to the app with; null for accounts created before emails were required. */
  email: string | null
  /** `pending` until the customer activates the mobile app with a Firebase account and their NIS. */
  activation_status: ActivationStatus
  activated_at: string | null
  /** The customer creates the PIN in the app after activation; nothing that needs a PIN works before. */
  pin_set: boolean
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
  /** Only an activated customer with a PIN can approve a withdrawal. */
  activation_status: ActivationStatus
  pin_set: boolean
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
  /** Withdrawals approved by the customer in the mobile app (returned by `complete` and audit detail). */
  withdrawal_authorization?: { id: string; method: 'mobile'; approved_at: string } | null
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

/** `GET /admin/customers/{id}/card`: what the printed card shows; `qr_payload` is encoded as the QR. */
export interface CustomerCard {
  account_number: string
  nis: string
  full_name: string
  class: CustomerClass
  group: CustomerGroup
  major: { code: string; major_name: string }
  account_status: AccountStatus
  qr_payload: string
}

/** One side of a double entry; every transaction has exactly one debit and one credit line. */
export interface Journal {
  id: number
  transaction_id: number
  account_code: AccountCode
  account_name: string
  position: JournalPosition
  amount: number
  created_at: string
  /** `GET /audit/journals` only. */
  transaction?: {
    id: number
    type: TransactionType
    customer: { account_number: string; full_name: string }
    teller: { full_name: string }
  }
}

/** `GET /audit/transactions/{id}`: a transaction with its journal lines. */
export type AuditTransaction = Transaction & { journals?: Journal[] }

/** Cash moved from a teller's drawer to the main vault, created by a report approval. */
export interface CashTransfer {
  id: number
  source: 'teller_drawer'
  destination: 'main_vault'
  amount: number
  transferred_at: string
  daily_report: { id: number; report_date: string; teller: PersonRef }
  approved_by: PersonRef
}

/** `GET /audit/journals/summary`: trial balance; double entry keeps it balanced. */
export interface TrialBalance {
  accounts: { account_code: string; account_name: string; total_debit: number; total_credit: number }[]
  total_debit: number
  total_credit: number
  is_balanced: boolean
}

/** `GET /teller/shift` */
export type ShiftState =
  | { data: DailyReport; can_transact: boolean; transactions: Transaction[] }
  | { data: null; can_transact: false; closed_today: boolean }

export interface Settings {
  min_balance: number
  qr_scanner_mode: QrScannerMode
  withdrawal_verification: WithdrawalVerification
}

/**
 * `GET|POST /teller/withdrawal-authorizations[/{id}]` (Mode A): the teller asks,
 * the customer approves with their PIN in the mobile app, the teller completes.
 * The teller never sees or sends the PIN.
 */
export interface WithdrawalAuthorization {
  /** ULID */
  id: string
  status: WithdrawalAuthorizationStatus
  status_label: string
  amount: number
  amount_in_words: string
  customer?: { id: number; account_number: string; full_name: string; class: CustomerClass }
  daily_report_id: number
  created_at: string
  /** Deadline for the customer to decide (created + 120 s). */
  expires_at: string
  approved_at: string | null
  /** Deadline for the teller to complete (approved + 120 s). */
  approval_expires_at: string | null
  rejected_at: string | null
  cancelled_at: string | null
  cancel_reason: 'teller' | 'shift_closed' | null
  consumed_at: string | null
  transaction_id: number | null
  /** For an accurate countdown regardless of the client's clock. */
  server_time: string
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
