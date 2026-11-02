# Frontend Architecture Audit — E-Teller Bank Mini (staff web app)

Status: audit 2026-10-28. **Phase 0 (foundations) and Phase 1 (Teller slice, T1–T10)
implemented 2026-10-28**; decisions D1–D3 taken as recommended (TypeScript, Indonesian UI,
`sessionStorage`). **2026-11-01: Teller UI redesigned** (docs/design/) and withdrawals moved
to Mode A (customer approves in the mobile app; the teller UI has no PIN field and no longer
calls `POST /teller/withdrawals`). **2026-11-02: Phase 2 (Supervisor) implemented**: dashboard,
daily report list and review (approve / hold / reject), report PDF, vault ledger. Customers and
staff (read-only) stay in Phase 3 with the other shared read pages. **2026-11-02: Phase 3 implemented**
(admin and supervisor): audit log with filters, detail with journal and app approval, PDF; journal and
trial balance, PDF; reports page (annual, audit trail, journal PDFs); customers list/detail with
activation status and statement PDF; staff list/detail. D5 taken: admin sees the audit pages. **2026-11-02: Phase 4
implemented**: admin home, settings, staff add/edit/block/delete/import, open account (required email,
invitation result), edit (suspend, PIN reset), resend invitation, card print with QR, close one account or
a whole class (graduation, one request per account). Next: Phase 5 (customer mobile app, separate project).

**2026-11-02: backend `b2eb9d8` (customer Firebase login).** Staff login is unchanged. For the
staff app this adds work to the admin pages (Phase 4): `POST /admin/customers` requires a unique
`email`; customers carry `email` and `activation_status` (`pending`/`activated`, with
`activated_at`); the customer list takes an `activation` filter; pending accounts can be re-invited
(`POST /admin/customers/{id}/invitation`), and the create response reports
`invitation.mail_sent`; the email is editable only while activation is pending. Customers no
longer get a token from NIS + PIN (the answer is `activation_required` /
`firebase_login_required`), so local tests that act as the customer need a token another way.
Low-fidelity wireframes for every role, including the new customer activation and login
screens, are in `docs/wireframes/`.

**2026-11-02: backend `a9a6dee`–`55d2bcf` (customer creates the PIN; no emails).** Caught up:
open account sends no PIN and shows the student's next steps instead of an invitation result; edit
has no PIN field; "Kirim ulang undangan" is replaced by "Reset PIN" (`POST
/admin/customers/{id}/pin-reset`, confirmation only, no PIN typed); list and detail show the app
state (belum aktivasi / belum buat PIN / aplikasi aktif). The teller panel shows the same state and
blocks "Tarik" until the customer is activated and has a PIN; a `customer_app_not_activated` or
`pin_not_set` refusal refreshes the lookup. The wireframes still show the earlier invitation and
admin-PIN screens.

**2026-11-02: Phase 5 implemented** in `../mobile-app` (Expo SDK 58, web and phones): Firebase
sign-in (email/password; Google on the web), activation with the NIS, PIN creation, PIN unlock
(on start and after a minute in the background), home, history, transaction detail, digital card
QR, change PIN/password, statement PDF, sign out, and withdrawal approval (polled every 4 s,
server-clock countdown). Tested end to end on the web against the Firebase Auth emulator and a
scratch backend, including teller request → approve with PIN → teller completes. Deploy of both
web apps: `../.github/workflows/deploy.yml` and `../DEPLOY.md`.

Phase 1 findings:

- The local MariaDB `ukk_laravel` schema predates the backend code (`daily_reports.opening_balance`
  missing → `500` on shift open). Rebuild it with `php artisan migrate:fresh --seed` (destroys its
  data) before running the app against it. Phase 1 was verified against a separate, freshly seeded
  SQLite database instead.
- A2 confirmed: one `Idempotency-Key` reused across wrong-PIN retries records the withdrawal once
  the PIN is right; a lost response retried with the same key returns `200` and records nothing new.
- Webcam scanning could not be exercised end to end (no camera in the test browser); the denied /
  unavailable paths were.

Scope: the React staff web app (Admin, Supervisor, Teller) in
`~/school/ukk/bank_mini/front-end/`. The customer app (React Native + Expo, Mobile
User) is a separate target and is covered here only for what it can share.

## 0. Sources

Read in the order set by `bank-mini-laravel/docs/README.md`:

1. `FRONTEND_HANDOFF.md` 2. `RBAC.md` 3. `WORKFLOWS.md` 4. `AUTH.md`
5. `DATA_MODEL.md` 6. `API.md` (conventions, login, settings, all teller sections,
objects, workflows) 7. `UI_REQUIREMENTS.md`, plus `BACKEND_CHECKPOINT.md` and the
teller entries of `API_SUMMARY.json`.

The backend was **not modified**. One documentation ambiguity was checked in source
with a read-only grep (see §8, A1). Every endpoint named in this document exists in
the backend's 58-route list; none were invented.

---

## 1. Key findings

| # | Finding | Consequence |
| --- | --- | --- |
| F1 | **`front-end/` is empty.** The `bank_mini` repo contains only `README.md` (one commit, `ab692a8`). | There is no existing frontend code for this project. This is a new build, not a refactor. |
| F2 | The only React code on this machine that resembles a bank-mini frontend is `~/project/ukk-bank-mini/fe_v1`, in **another person's repository** (`github.com/Alfian-ysb/ukk-bank-mini`), built for a **different domain** (roles `applicant`/`analyst`/`verifier`/`manager`, email login at `/api/auth/login`). | Not reusable as code. Only its stack choice is a useful reference (§2). |
| F3 | `~/project/react-bank` is a third-party open-source app (`jurkian/react-bank`, Redux + Node). | Unrelated. Not reusable. |
| F4 | The backend is complete for the staff app: every page in `UI_REQUIREMENTS.md` maps to existing endpoints. | No frontend feature is blocked on the backend. |
| F5 | The teller workflow is driven by one state endpoint (`GET /teller/shift`) and has the most money-safety rules (idempotency, PIN lock order, multiples of Rp100, cash reconciliation). | Build a solid API client, error model and auth layer **before** the first teller screen; the teller slice exercises all of it. |
| F6 | `GET /teller/shift` returns transactions **without** `corrected_by` (verified, §8 A1). | Correction eligibility must be derived from `corrects_transaction_id` inside the shift's own transaction list. |

---

## 2. Existing frontend inventory and reuse assessment

### 2.1 Target directory

```text
bank_mini/                 git repo, origin github.com/Adib-Fathurrohman/ukk_bank_mini
├── README.md              "# ukk_bank_mini" (modified: trailing newline only)
├── .DS_Store              untracked; add to .gitignore at scaffold time
└── front-end/             empty (this audit is the first file)
```

### 2.2 Reference code found elsewhere (read only, not copied)

`~/project/ukk-bank-mini/fe_v1` — Vite + React 19 + react-router-dom 7 +
Tailwind CSS 4, JavaScript.

| File | What it does | Reuse verdict |
| --- | --- | --- |
| `context/authSession.jsx` | Reads token/role from `sessionStorage`; maps roles to routes | **Concept only.** Wrong roles; no `actor`; no `/staff/me` revalidation; no 401/403 handling |
| `context/protectedRoute.jsx` | Role route guard | **Concept only.** Broken: uses `Outlet` without importing it; never wired (commented out in `App.jsx`) |
| `pages/LoginForm.jsx` | Email/password `fetch` to `http://127.0.0.1:8000/api/auth/login` | **No.** Wrong field (`email`, backend wants `username`), wrong path (`/api/login`), wrong response path (`data.token` vs `data.data.token`), hard-coded URL, no error/loading states |
| `components/DashboardLayout.jsx` | Responsive sidebar shell | **No.** References an undefined `sidebarContent` (crashes when the mobile menu opens); no navigation |
| `components/Button.jsx`, `Table.jsx` | Themed button, placeholder table | **No.** Button forces `w-full`, has no `type`/`disabled`; table is static lorem ipsum |
| `index.css` | Tailwind 4 `@theme` tokens (green palette, Poppins/Inter) | **No.** Another project's visual identity; visual design is undecided |

**Verdict: nothing is reused as code.** The stack (Vite, React 19, React Router 7,
Tailwind 4) is a sensible, current baseline and is adopted below. Ownership of `fe_v1`
should be confirmed before any of it is used even as reference (§10, D4).

---

## 3. Product and roles (as the backend implements them)

A school mini bank. Students (nasabah) hold savings accounts; **all money moves at the
counter through a teller**. Every transaction belongs to a teller's daily **shift**,
which is also the end-of-day report a supervisor reviews.

| Role | Client | Does | Never does |
| --- | --- | --- | --- |
| **Admin** (`users.role = admin`) | Web | Manages tellers/supervisors (incl. import), customer accounts (open, edit, PIN reset, suspend, graduate, card), settings; reads audit log, journal, trial balance, PDFs | Handles money, runs shifts, reviews reports, sees the vault ledger, edits any admin account |
| **Supervisor** (`supervisor`) | Web | Reviews daily reports (approve / hold / reject), sees the vault ledger, reads staff, accounts, audit, journal, PDFs; **authorizes corrections by typing their credentials on the teller's screen** | Creates/edits anything, records transactions, prints cards |
| **Teller** (`teller`) | Web | Opens/closes own shift with cash counts, looks up a customer (QR / account number / NIS), deposits, withdrawals (customer types PIN), corrections (supervisor types credentials), receipts, own shift history and daily report PDF | Browses customers, sees other tellers' data, reads audit/journal |
| **Mobile User** (customer, separate `customers` model) | Expo | Views own balance, statement, transaction detail, digital card (QR), statement PDF; changes own PIN | Moves money, uses any staff endpoint |

Routing rule: route by `data.actor` from `POST /login`, then by `data.user.role`.
The web app refuses `actor: "customer"`. Hiding pages is convenience only; the backend
re-checks every request.

---

## 4. Proposed architecture

### 4.1 Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Build | **Vite** + React 19 | Fast dev server; built-in proxy solves CORS header limitation L4 in development |
| Language | **TypeScript** (recommended; see D1) | The API contract is large and precise (enums, nullable fields, extra error fields); types catch contract drift |
| Routing | React Router 7 (library mode) | Nested layouts + role guards |
| Server state | **TanStack Query** v5 | Caching, refetch after mutations, loading/error states; mutations never retried automatically for money |
| Styling | Tailwind CSS 4 | Utility-first; no design system decided yet, so keep components plain |
| Forms | Controlled components + small hooks | Forms are few and specialised (denomination counter, PIN pad); a form library is optional |
| QR (webcam) | A browser QR library chosen in step T9 (e.g. `qr-scanner` or `@zxing/browser`) | Backend does not scan or generate QR images |
| QR (render, admin card) | `qrcode.react` or similar, Phase 4 | Render `qr_payload` |
| Tests | Vitest for pure logic; manual end-to-end against the seeded backend | Money/format/eligibility logic is where bugs cost most |

### 4.2 Folder layout

```text
front-end/
├── .env.example                 VITE_API_BASE_URL=/api
├── vite.config.ts               server.proxy: /api → http://localhost:8000
├── docs/FRONTEND_AUDIT.md
└── src/
    ├── main.tsx · App.tsx · routes.tsx
    ├── api/
    │   ├── client.ts            fetch wrapper: base URL, headers, token, JSON/blob, error normalisation, global 401/403
    │   ├── errors.ts            ApiError union (see §5.4)
    │   ├── types.ts             Staff, Customer, CustomerSummary, Transaction, DailyReport, CashCount, Settings, Paginated<T>, enums
    │   └── endpoints/           auth.ts · settings.ts · teller.ts · (supervisor.ts, audit.ts, admin.ts later)
    ├── auth/                    AuthProvider · useAuth · RequireRole · tokenStorage
    ├── lib/                     money.ts · terbilang.ts · datetime.ts (UTC→WIB) · denominations.ts · idempotency.ts · download.ts
    ├── components/              Button · Field · Dialog · Table · Pagination · StatusBadge · Money · EmptyState · ErrorBanner · PinPad · DenominationCounter
    ├── layouts/StaffLayout.tsx  nav items per role from the RBAC matrix
    └── features/
        ├── auth/LoginPage.tsx
        ├── teller/              ShiftGate · OpenShift · Counter · CustomerPanel · DepositDialog · WithdrawalDialog ·
        │                        TodayTransactions · CorrectionDialog · CloseShift · ShiftHistory · ShiftDetail
        ├── supervisor/          (Phase 2)
        ├── audit/               (Phase 3, shared by admin + supervisor)
        └── admin/               (Phase 4)
```

`api/types.ts`, `lib/money.ts`, `lib/terbilang.ts`, `lib/datetime.ts` and
`api/errors.ts` have no DOM dependencies and can later be copied or shared with the
Expo app.

### 4.3 Route map (staff web app)

| Path | Role | Notes |
| --- | --- | --- |
| `/login` | public | |
| `/teller` | teller | Shift gate: renders the right state from `GET /teller/shift` |
| `/teller/counter` | teller | Lookup + deposit/withdrawal |
| `/teller/transactions` | teller | Today's transactions, receipt reprint, correction |
| `/teller/close` | teller | Close shift |
| `/teller/history`, `/teller/history/:id` | teller | Own shifts, daily report PDF |
| `/supervisor/...` | supervisor | Phase 2 |
| `/audit/...`, `/reports` | admin, supervisor | Phase 3 |
| `/admin/...` | admin | Phase 4 |

---

## 5. API integration requirements (cross-cutting)

Everything below must exist before the first teller screen.

### 5.1 Base URL and transport

- `VITE_API_BASE_URL`, default `/api`. In development the Vite proxy forwards `/api` to
  `http://localhost:8000`, making requests same-origin, so `Content-Disposition` and
  `Idempotent-Replayed` headers are readable (works around L4).
- Production URL is **unknown** (checkpoint). Assume cross-origin: never depend on
  response headers; name PDF files on the client; detect replays by `200` vs `201`.
- Every request: `Accept: application/json`; `Content-Type: application/json` with a
  body; `Authorization: Bearer <token>` except `POST /login`.
- Use `POST /login` only (not the `/staff/login` alias, I2).

### 5.2 Auth

| Step | Behaviour |
| --- | --- |
| Login | `POST /login {username, password}`. Disable the button while pending. `422` → field message under `errors.username`; `429` → "Terlalu banyak percobaan, tunggu satu menit". |
| Wrong actor | If `data.actor === "customer"`: revoke that token with `POST /customer/logout`, discard it, show "Gunakan aplikasi mobile". |
| Storage | Token + `actor` + `user` in `sessionStorage` (recommended for shared counter PCs, see D3); keep in memory as well. Never store passwords or PINs. |
| App start | If a token exists, `GET /staff/me` before rendering protected routes; `401`/`403` → clear and show login. |
| Global `401` | Clear token, go to `/login` (expired after 8 h, no refresh, L7). |
| Global `403` | Clear token, go to `/login` with the server message (UKK rubric 3.2). **Exception:** `Akun administrator tidak dapat diubah melalui API.` on admin staff edit is a normal error (Phase 4). |
| Logout | `POST /staff/logout`; clear the token even if the request fails. |
| Login time | Record it client-side to optionally warn before the 8 h expiry (the API does not return expiry). |

### 5.3 Response shapes

- Single: `{data}`. Paginated: `{data[], links, meta}`. `GET /teller/shift` adds
  top-level `can_transact`, `transactions` or `closed_today`; shift/report detail adds
  top-level `transactions`. The client must return the **whole body** for these, not
  only `data`.
- Optional relations are **omitted** (not `null`) when not loaded; type them as
  optional.

### 5.4 Error model

The client converts every non-2xx response into one typed error:

| Kind | Detected by | UI |
| --- | --- | --- |
| `auth` | `401`, `403` | Global logout (except the admin-account `403`) |
| `validation` | `422` with `errors` | Message next to each field (`errors.field[0]`); map English Laravel messages to Indonesian where shown (L9) |
| `business` | `422` without `errors` | Prominent banner with `message` (already Indonesian); nothing was saved |
| `cashMismatch` | `422` with `difference` | Keep the close form, show `system_balance`, `physical_balance`, `difference` |
| `pin` | `422` with `remaining_attempts` | Show remaining attempts or lock time from `pin_locked_until` (UTC → WIB) |
| `notFound` | `404` | Not-found state (`Nasabah tidak ditemukan.`) |
| `conflict` | `409` | Phase 4 (staff delete → offer Block) |
| `rateLimited` | `429` | "Terlalu banyak percobaan" |
| `server` | `5xx` | Generic message; **never render the body** (local `APP_DEBUG=true` includes a stack trace) |
| `network` | fetch rejected / timeout | Outcome unknown for money calls → offer retry with the **same** idempotency key |

### 5.5 Money-moving requests

- `POST /teller/deposits`, `/teller/withdrawals`, `/teller/transactions/{id}/correct`.
- Generate an `Idempotency-Key` when the confirmation dialog opens; reuse it for every
  retry of that submission; a changed account or amount means a new dialog and a new
  key (L16). `201` = recorded, `200` = replay of an earlier success; both are success.
- Disable submit while pending. No automatic retries (TanStack Query `retry: false`
  for mutations). No optimistic updates. Success screens show **server values**
  (`id`, `balance_after`, `amount_in_words`), never form values.
- `crypto.randomUUID()` only exists in secure contexts (`https://` or `localhost`). A
  counter PC opening the app over `http://<LAN IP>` would not have it → generate keys
  with `crypto.getRandomValues` (available everywhere).

### 5.6 PDFs

Receipt, daily report (and later statements, audit, journal, annual): request as a
blob with the bearer header (a plain `<a href>` cannot send it). If the response
`Content-Type` is JSON, parse it and show `message` (e.g. the daily report is locked
until a matching close). Open via an object URL in a new tab for printing; name files
on the client (`struk-{id}.pdf`, `laporan-harian-{date}.pdf`).

### 5.7 Formatting and dates

- Money: integer Rupiah in and out; display `Rp1.500.000` (`id-ID`, no decimals).
  Inputs accept digits only and send integers.
- Timestamps: UTC ISO → display in `Asia/Jakarta` (WIB) via `Intl.DateTimeFormat`.
- Dates (`report_date`, `date` filter): `YYYY-MM-DD`, server timezone. "Today" is the
  server's date: rely on `can_transact` / `closed_today` rather than the client clock,
  and omit `date` on `GET /teller/transactions` to get the server's today.
- Labels: use `type_label` from transactions; map report statuses locally
  (Berjalan, Menunggu verifikasi, Ditahan, Disetujui, Ditolak — the backend PDF labels).

### 5.8 Pagination

`page` / `per_page` (clamped 1–100). No sort parameters (L18): accept server order.

---

## 6. First target: Teller vertical slice

### 6.1 Endpoints used (all existing)

| Endpoint | Purpose |
| --- | --- |
| `POST /login`, `GET /staff/me`, `POST /staff/logout` | Session |
| `GET /settings` | `min_balance`, `qr_scanner_mode` |
| `GET /teller/shift` | Shift state, live totals, shift transactions |
| `POST /teller/shift/open` | Opening count |
| `GET /teller/customers/lookup?identifier=` | Customer by QR payload / account number / NIS |
| `POST /teller/deposits` | Deposit |
| `POST /teller/withdrawals` | Withdrawal with PIN |
| `GET /teller/transactions?date=` | Own transactions of a day (paginated, 50/page, with `corrected_by`) |
| `GET /teller/transactions/{id}/receipt` | Receipt PDF |
| `POST /teller/transactions/{id}/correct` | Correction with supervisor credentials |
| `POST /teller/shift/close` | Closing count |
| `GET /teller/daily-reports`, `/{id}`, `/{id}/export` | Shift history, detail, daily report PDF |

### 6.2 Shift gate (state machine from `GET /teller/shift`)

| Response | State | Allowed |
| --- | --- | --- |
| `data: null`, `closed_today: false` | No shift | Open-shift form |
| `data: null`, `closed_today: true` | Closed for today | History and PDF only; counter disabled |
| `status: open`, `can_transact: true` | Running | Counter, transactions, corrections, close |
| `can_transact: false` (earlier date, `open` or `rejected`) | Stale shift | Corrections and close only; banner "Tutup shift tanggal X terlebih dahulu" |
| `status: rejected`, `can_transact: true` | Reopened today | Show `supervisor_note`; counter, corrections, re-close. Ignore or label "hitungan sebelumnya" the stale `physical_balance`, `difference`, `closing_counts` (L3) |

The gate state is shown in the layout header on every teller page and is refetched
after every mutation.

### 6.3 Screens and rules

**T1. Open shift.** `DenominationCounter` with the ten denominations (100000 … 100),
quantity inputs 0–100000, live subtotal per row and total. Submit
`{denominations: {"50000": 2, ...}}` (zero rows may be omitted). `201` → counter.
`422` business messages (shift still running / already closed today) → banner and
refetch the gate.

**T2. Counter — lookup.** One identifier field, always present and auto-focused.
- `usb` mode: a keyboard-wedge scanner types `BANKMINI:RPL-2026-001` + Enter into that
  field → submit on Enter.
- `webcam` mode: camera scanner (T9) fills the same field; manual typing still works.
- `disabled`: manual entry only.
- URL-encode the identifier (the payload contains `:`). `404` → "Nasabah tidak
  ditemukan". Lookup does not require a shift.

**T3. Customer panel.** Name, account number, NIS, class/group/major, status badge,
balance, PIN lock (`pin_locked_until` in WIB). Deposit/withdraw disabled when
`account_status !== "active"` or the gate does not allow transactions; withdraw also
disabled while `pin_locked_until` is in the future. Refetch the lookup after every
transaction (balance changes).

**T4. Deposit.** Amount input: integer, 1–100,000,000, **multiple of 100** (L1,
otherwise the shift can never be closed). Confirmation dialog: type, account number,
name, amount, amount in words (local `terbilang`), Enter to confirm. Success: server's
`balance_after` and `amount_in_words`, transaction id, "Cetak struk", "Transaksi baru".

**T5. Withdrawal.** Same amount rules, plus the **pre-checks before the PIN pad**
(L2: a wrong PIN counts even when the withdrawal would fail anyway):
`can_transact`, status `active`, not PIN-locked, and
`balance − amount ≥ min_balance` (hint only; server decides). Then the customer types
the 6-digit PIN on a masked PIN pad. The PIN is cleared after every attempt and never
stored. `422` with `remaining_attempts` → "PIN salah, sisa N"; with `remaining_attempts: 0`
→ lock message, disable withdraw, refetch lookup; insufficient balance → banner.

**T6. Today's transactions.** `GET /teller/transactions` (server's today), paginated.
Columns: time (WIB), id, type label, customer, amount, balance after, correction link.
Actions: reprint receipt; "Koreksi" when eligible (§6.4).

**T7. Correction.** Dialog with the original's summary, `reason` (≤ 255), and
`supervisor_username` + `supervisor_password` typed by the supervisor (password field,
cleared on close, never stored). Idempotency key per dialog. Errors:
`errors.supervisor_password` under the field; already corrected / wrong shift /
balance insufficient as banners; `429`. On success, show the correction and prompt to
record the correct amount (prefill the counter with that customer).

**T8. Close shift.** Show `opening_balance`, `total_deposit`, `total_withdrawal`,
`system_balance`, `transaction_count` from the live gate. `DenominationCounter` with a
live "counted vs system" difference before submit. `200` → status `submitted`, offer
the daily report PDF. `422` mismatch → keep the form, show the server's difference,
suggest recount or correction.

**T9. Webcam QR.** Added last in the slice. `getUserMedia` needs a secure context:
works on `localhost`, **not** on `http://<LAN IP>`. Fall back to manual/USB with an
explanatory message when the camera is unavailable.

**T10. Shift history.** `GET /teller/daily-reports` (status, date, totals),
detail `/{id}` (counts, transactions, supervisor note, cash transfer), PDF
`/{id}/export` only for `submitted`, `on_hold`, `approved` (otherwise the button is
hidden; a JSON error is still handled).

### 6.4 Correction eligibility

A row may be corrected when all hold:

1. `type` is `deposit` or `withdrawal`;
2. it is not already corrected;
3. `daily_report_id` equals the active shift id.

For rows from `GET /teller/transactions`, (2) is `corrected_by == null`. For rows from
`GET /teller/shift.transactions`, `corrected_by` is **not present** (A1), so compute
the set of `corrects_transaction_id` values in that same array: a correction always
lives in the original's shift, so that array is complete. Prefer the shift array for
eligibility (it covers a stale shift from an earlier date, which the "today" list does
not); the server re-checks anyway.

### 6.5 Slice acceptance criteria

Against `php artisan migrate:fresh --seed` and the demo `teller` / `supervisor`
accounts:

1. Teller logs in and lands on the shift gate; a customer login on the web app is refused.
2. Opens a shift with a denomination count.
3. Looks up seeded customers by account number, NIS and a `BANKMINI:` payload.
4. Records a deposit and a withdrawal; receipts open as PDFs.
5. A wrong PIN shows remaining attempts; three wrong PINs lock withdrawals and the UI
   reflects the lock.
6. A non-multiple of 100 cannot be submitted.
7. A correction with supervisor credentials reverses a transaction; the original is no
   longer correctable.
8. A wrong closing count shows the difference; a correct count submits the report and
   the daily report PDF downloads.
9. After closing, the gate shows "closed for today" and the counter is disabled.
10. A double-click or a retry after a simulated timeout records **one** transaction.
11. Token removal / expiry / a supervisor URL opened as teller returns to login.

The rejected-shift path (§6.2 last row) needs a supervisor rejection; it can be
triggered with a direct API call until Phase 2 exists.

---

## 7. Missing frontend functionality (everything, by phase)

Nothing exists yet, so "missing" is the full list. Grouped by where it is built.

| Area | Items | Phase |
| --- | --- | --- |
| Foundations | Vite/TS/Tailwind scaffold, env + proxy, API client, error model, types, auth provider, login, `/staff/me` revalidation, role guards, staff layout + logout, money/date/terbilang utils, PDF helper, base components | 0 |
| Teller | T1–T10 above | 1 |
| Supervisor | Dashboard (counts from `?status=submitted/on_hold/open` with `meta.total`, today's `cash-transfers` `total_amount`, today's trial balance); daily report list (`status`, `date`, `teller_id` from `GET /staff?role=teller`); review (approve with confirm, hold/reject with required note, reject failure → suggest hold; one at a time); report PDF; vault ledger list/detail | 2 |
| Admin + Supervisor (read) | Audit transaction log + detail + PDF; journal + trial balance (`is_balanced`) + PDF; annual report PDF (`school_year`); customers list/detail (read-only for supervisor) + statement PDF; staff list/detail (read-only for supervisor) | 3 |
| Admin (write) | Dashboard (counts via `per_page=1`); staff create/edit/block/unblock/delete (`409` → offer block) / import (row errors `rows.{i}.{field}`, generated passwords shown once); customer open (show generated number) / edit / PIN reset / suspend / graduate (strong confirm, warn on balance > 0, L5); card print rendering `qr_payload` as QR; settings (`min_balance`, `qr_scanner_mode`) | 4 |
| Mobile (Expo, separate) | Login (`identifier`+`pin`, refuse staff), home/balance, history (infinite scroll), detail, digital card QR, profile, change PIN, statement PDF, logout; `expo-secure-store`; LAN base URL | 5 |
| Quality | Indonesian mapping of field errors, accessibility and keyboard flow, responsive layout, end-to-end tests | ongoing / 6 |

**Do not build** (backend does not support): staff password change or profile edit,
forgot password/PIN, customer-initiated transfers, restoring closed accounts, major
management, bulk approval, notifications, JSON annual report or dashboard statistics
endpoints, editing/deleting transactions, Customer Service/Accounting roles,
multiple savings products.

---

## 8. Documentation ambiguities and how they are handled

| # | Item | Resolution |
| --- | --- | --- |
| A1 | Docs say teller transactions include `corrected_by`, but do not say whether `GET /teller/shift.transactions` does. | **Verified read-only in source:** `TransactionResource` emits `corrected_by` only `whenLoaded('correction')`, and only `Teller/TransactionController` (list) and the audit controller load it. The shift array omits it. Handled by §6.4. |
| A2 | Whether a failed (`422`) withdrawal "uses up" its idempotency key. | Docs: any failure saves nothing, and replay compares amount/customer/type (not PIN). One key per confirmation dialog, reused across PIN retries, is consistent with the documented behaviour. Verify in T5 testing. |
| A3 | Production base URL and whether the app is served same-origin: **unknown** (checkpoint). | Code never depends on response headers (§5.1). |
| A4 | Counter PCs reaching the app over LAN `http://` lose secure-context APIs (camera, `randomUUID`). | §5.5, T9. Deployment decision outside this audit. |
| A5 | I1: Admin can read the audit log though a strict reading of the soal matrix might not show it. | Decide in Phase 3 (D5). Not relevant to the teller slice. |
| A6 | Backend checkpoint says `docs/` was uncommitted at handoff; you say it is pushed. | Docs reference commit `5ddbd69`. No frontend impact; mention only if the docs change. |

---

## 9. Implementation order

| Phase | Goal | Done when |
| --- | --- | --- |
| **0. Foundations** | Scaffold, API client, error model, types, auth, login, layout, role guards, utils (+ Vitest for money, terbilang, denomination totals, error normalisation, correction eligibility) | All three staff roles log in, land on their (placeholder) home, log out; 401/403 return to login; customer actor refused |
| **1. Teller slice** | T1 open shift → T2/T3 lookup + panel → T4 deposit + receipt → T5 withdrawal → T6 today's list → T7 correction → T8 close + PDF → T10 history → T9 webcam | §6.5 acceptance list passes against the seeded backend |
| **2. Supervisor** | Review loop and vault ledger | A teller's submitted report can be approved, held, rejected; the rejected path in the teller UI is exercised end to end |
| **3. Shared read pages** | Audit, journal, trial balance, reports, read-only customers/staff | Admin and supervisor see the same read pages with correct guards |
| **4. Admin management** | Staff, customers, card print, settings, dashboard | All admin rows of the RBAC matrix are reachable |
| **5. Mobile (Expo)** | Separate project; reuse types and pure utils | Mobile User pages in `UI_REQUIREMENTS.md` |
| **6. Hardening** | Error language, a11y, responsive, e2e | |

Phase 2 follows the teller slice immediately because the teller's rejected-shift path
and the end-of-day loop only become testable through the UI with it.

---

## 10. Decisions needed before Phase 0

| # | Decision | Recommendation |
| --- | --- | --- |
| D1 | TypeScript or JavaScript | TypeScript |
| D2 | UI language | Indonesian (users are Indonesian students/staff; business messages already Indonesian) |
| D3 | Token storage | `sessionStorage` (counter PCs are shared; closing the browser ends the session) |
| D4 | Is `~/project/ukk-bank-mini/fe_v1` yours to use as a reference? | Treat as not reusable either way (§2.2) |
| D5 | Show the audit log to Admin (I1) | Yes, as the backend allows; revisit in Phase 3 |
