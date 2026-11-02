# Design Direction — Bank Mini Teller ("Loket")

Status: **implemented in React, 2026-11-01.** The Figma step was dropped (MCP plan limits);
the direction below was built straight into the app. Tokens live in `src/index.css`
(`@theme`), components in `src/components/`. Research behind it:
[MOBBIN_RESEARCH.md](MOBBIN_RESEARCH.md) (rounds 1 and 2).

## 1. Brand direction

**A ledger, not a dashboard.** The teller screen is a working instrument used at a cash desk
with a customer watching. It should feel like a well-made bank form: precise, calm,
unambiguous. Trust comes from restraint: one strong number, aligned columns, ink on white,
colour only when it means something.

| We want | Expressed as |
| --- | --- |
| Trust | Navy chrome, ink text, no gradients, no illustration in work surfaces |
| Accuracy | Tabular figures everywhere money appears; account numbers in mono; server values only |
| Efficiency | Keyboard-first counter; the next field is always focused; Enter confirms |
| Reliability | Every async state named and visible (shift, approval, retry); nothing optimistic |
| Professionalism | Dense but breathable tables; 1px lines instead of shadows; consistent 4pt spacing |

## 2. Colour

Neutrals ("ink") carry the UI. Navy is the one brand colour (primary action, active nav,
focus). Green, amber and red only mean money-in/success, waiting/warning and error.
Tailwind names in brackets.

| Token | Hex | Use |
| --- | --- | --- |
| `ink-900` | `#101828` | Primary text, amounts |
| `ink-600` / `ink-500` | `#475467` / `#667085` | Secondary text, labels, hints |
| `ink-300` / `ink-200` | `#D0D5DD` / `#E4E7EC` | Control borders / panel borders and rules |
| `canvas` | `#F6F7F9` | App background; panels are white |
| `brand-700` | `#1D4E89` | Primary buttons, active nav (`brand-50` surface) |
| `brand-600` | `#2B62A8` | Focus ring and focused borders |
| `pos-700` | `#0E7A4F` | Money in (+), success |
| `warn-500` / `warn-800` | `#D98A1C` / `#7A4500` | Pending countdown / warning text |
| `neg-700` | `#B42318` | Errors, refusals, mismatch, destructive action |

Rules: money **out** is ink with "−", never red (red means *something went wrong*).
Status is never colour alone: every badge has a text label.

## 3. Typography

**IBM Plex Sans** (variable) for UI, **IBM Plex Mono** for account numbers, NIS and IDs,
self-hosted through `@fontsource` so a school LAN without internet renders the same.
Plex has an institutional, engineered feel without being cold. The whole app uses
`font-variant-numeric: tabular-nums`; amounts render through `<Amount>` with a smaller
"Rp" so the number reads first. Totals get an accountant's double rule.

| Style | Size / line | Weight | Use |
| --- | --- | --- | --- |
| Display amount | 40 / 48 | 600 | The amount in entry, confirmation, waiting and result |
| H1 | 24 / 32 | 600 | Page title |
| H2 | 18 / 26 | 600 | Panel title |
| Body | 14 / 20 | 400 | Default |
| Body strong | 14 / 20 | 600 | Values in key–value lists |
| Label | 12 / 16 | 500 | Field labels, table headers (sentence case) |
| Mono | 13 / 20 | 500 | `RPL-2026-001`, `20260001`, `#4` |

## 4. Spacing, radius, elevation, grid

- **Spacing (4pt):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
- **Radius:** 4 inputs/badges · 6 buttons · 8 panels · 12 dialogs. No pills except status badges.
- **Elevation:** level 0 = 1px `line` border (panels, tables); level 1 = popovers
  `0 4px 12px rgb(16 24 40 / 8%)`; level 2 = dialogs `0 16px 40px rgb(16 24 40 / 16%)` +
  `navy-900` scrim at 48%. Panels never float.
- **Grid:**

| Breakpoint | Frame | Layout |
| --- | --- | --- |
| Desktop | 1440 | 232 px sidebar + content 12 col, 24 gutter, max 1176 |
| Laptop | 1280 | 232 px sidebar + 12 col, 20 gutter |
| Tablet | 768 | Top bar + menu drawer; 8 col, 16 gutter; counter panes stack |
| Mobile | 375 | Top bar; 4 col, 16 side margin; counter becomes a step flow with a sticky bottom action bar; no horizontal scroll (current standard) |

## 5. Iconography

**Lucide** paths (inline `<Icon>`, no dependency), outline, 1.75 px stroke, 16 px in tables/buttons and 20 px in navigation. Icons
always sit next to a label, except the close (✕) and copy buttons, which get `aria-label`s.

## 6. Interaction principles

1. **Shift first.** A status strip on every teller page states the shift (Belum dibuka ·
   Berjalan · Ditolak supervisor · Shift lama · Ditutup). Blocking states use the single alert
   slot under it.
2. **Keyboard first.** `/` focuses the lookup; a USB scanner types into it + Enter; after a
   customer loads, focus moves to the amount; Enter opens confirmation; Enter confirms;
   Esc cancels when nothing is pending. Visible 2 px `primary-600` focus ring, offset 2.
3. **Server truth.** Results show the server's transaction, never form values. No optimistic
   updates for money, shift or approval.
4. **Retry is safe and says so.** Unknown outcome (network) → "Status belum diketahui" + "Kirim
   ulang" with the same idempotency key; a replay is labelled "Sudah tercatat sebelumnya".
5. **No PIN on the teller screen (Mode A).** Withdrawals wait for the customer's approval in
   their app. The teller sees status and a countdown, never a PIN field.
6. **Errors next to their cause.** Field errors under the field; business refusals in the
   panel they refuse; mismatch figures inside the close form.

## 7. Component inventory

| Component | Variants / states |
| --- | --- |
| Button | primary · secondary · ghost · danger × default/hover/focus/pressed/disabled/loading |
| Text field, Money field | default/focus/filled/error/disabled; money field with `Rp` prefix + hint row |
| Segmented control | Setor / Tarik; selected/unselected/disabled |
| Status badge | shift: Berjalan · Menunggu verifikasi · Ditahan · Disetujui · Ditolak; account: Aktif · Ditangguhkan; approval: Menunggu nasabah · Disetujui · Ditolak nasabah · Kedaluwarsa · Dibatalkan · Selesai |
| Shift status strip | none · running · rejected · stale · closed today |
| Alert | info · warning · danger · success, with optional action |
| Customer panel | default · suspended · PIN locked · loading · not found |
| Denomination counter | row (empty/filled/focus) + total row + compare row (match/short/over) |
| Approval tracker | 3 steps × pending/approved/consumed/rejected/expired/cancelled, countdown ring |
| Result card | deposit · withdrawal · correction · replayed |
| Table row | transaction (normal/corrected/correction) · shift history |
| Dialog | confirm · destructive · form; pending (non-dismissable) |
| Sidebar nav, Top bar | desktop expanded · tablet/mobile drawer |

## 8. Teller withdrawal (Mode A) — states the design must cover

From `docs/API.md` §Withdrawal authorizations (backend commit `2cc6b58`). Only fields the
API returns are shown.

| API state | Teller sees | Actions |
| --- | --- | --- |
| before create | Amount + pre-check (status, PIN lock, `balance − amount ≥ min_balance`) | "Kirim ke aplikasi nasabah" |
| `422` open request exists | "Masih ada permintaan yang belum selesai" | Lanjutkan permintaan · Batalkan |
| `pending` | Tracker step 1, countdown to `expires_at` (120 s), customer + amount + terbilang | Batalkan |
| `approved` | Tracker step 2 done, countdown to `approval_expires_at` | **Selesaikan penarikan** · Batalkan |
| complete `201` / `200` | Result card (`withdrawal_authorization.method = mobile`), retry-safe | Cetak struk · Transaksi baru |
| `rejected` | "Ditolak oleh nasabah" | Buat permintaan baru |
| `expired` | "Waktu persetujuan habis" (pending or approved) | Buat permintaan baru |
| `cancelled` (`teller` / `shift_closed`) | Reason shown | Buat permintaan baru |
| network error while polling | "Koneksi terputus, mencoba lagi…" (keep polling; the request lives on the server) | — |
| page reload | Resume via `GET …?status=open` | — |

The customer-side approval screen belongs to the Expo app and is out of this Teller scope; the
Teller prototype represents it only as the waiting state (and, for the walkthrough, a small
annotated "phone" frame labelled *prototype data, customer app*).

## 9. What was built

| Area | Screens and states |
| --- | --- |
| Shell | 232 px sidebar (brand, shift status block with cash in drawer, menu, identity, sign-out); below `lg` a top bar with a status pill and a menu drawer; skip link |
| Shift (T1) | Open: denomination counter (Enter/↓/↑ between rows) + opening-balance column + confirm dialog · running/rejected/stale overview with ledger line and recent transactions · closed today |
| Counter (T2–T4) | Lookup (`/` shortcut, QR camera, USB wedge) with skeleton, not-found and error states · customer panel (identity, balance, withdrawable, NIS/class/major, suspended/PIN-lock notices) · Setor/Tarik radio switch, large amount, quick amounts, live balance-after, inline validation · deposit review → processing → receipt / unknown-outcome retry / replay label |
| Withdrawal (Mode A) | Review → "send to customer's app" → waiting panel (server-anchored countdown ring, 3-step tracker, cancel) → approved (focus on Complete) → receipt; rejected, expired, cancelled (teller / shift closed), consumed elsewhere, connection lost while polling, resume after reload. No PIN field anywhere |
| Transactions (T5) | Ruled table (stacked list on phones), detail dialog, receipt reprint, correction dialog (reason, supervisor credentials, errors, success → record correct amount) |
| Close shift (T6) | Ledger line, counter + live reconciliation (short/over/match), server mismatch, confirm, submitted page with daily-report PDF; rejected-report notice and re-close |
| History | Shift list (stacked on phones) and detail with counts and transactions |

Not offered: Mode B (PIN typed at the teller terminal). If the `withdrawal_verification`
setting is `terminal`, the counter explains that withdrawals cannot be processed here.
