# Mobbin Research — Teller Redesign

Date: 2026-11-01 · Source: Mobbin MCP (`search_screens`), web and iOS · 9 searches, ~50 screens
inspected. Every screen below was returned by Mobbin and looked at; links open it on Mobbin.

Scope: patterns for the Bank Mini **Teller** web app (counter staff, desktop first). The
reference products are not banks with teller desks; nothing on Mobbin covers that exact job, so
patterns are borrowed from POS, business banking, payments ops and verification flows and
combined.

## Searches run

| # | Query (platform) | Useful? |
| --- | --- | --- |
| 1 | point of sale cash register screen with amount entry and payment (web) | Yes: amount entry, confirm dialogs |
| 2 | banking app account overview dashboard with balance (web) | Yes: balance hierarchy |
| 3 | fintech admin customer search with customer profile details panel (web) | Yes: lookup + side panel |
| 4 | waiting for approval on your phone screen with pending status (web) | Partly: async "pending" states, but slow back-office reviews |
| 5 | point of sale app close cash drawer end of shift count (iOS) | **No drawer-count screens returned** |
| 6 | banking transactions table with status badges (web) | Yes: history tables |
| 7 | approve sign in request on your mobile device … waiting screen (web) | Yes: the closest analog to mobile withdrawal approval |
| 8 | Square point of sale cash drawer management (iOS) | **Empty result** |
| 9 | payment successful confirmation with receipt download (web) | Yes: result + receipt |

**Gap:** no Mobbin screen shows a denomination count or end-of-shift reconciliation. The
shift open/close design is therefore derived from the backend rules and general form/summary
patterns, not from a reference.

## References by Teller need

### 1. Amount entry and recording a transaction

| Reference | Pattern | Adopt | Avoid |
| --- | --- | --- | --- |
| [Fresha — Add cash amount](https://mobbin.com/screens/edfb1a02-b7ef-4354-850d-cf7b9ce8b74a) | Large centred amount, quick-amount chips, keypad, "Change" computed live, single primary "Add"; cart summary stays visible behind the modal | Big amount as the focal element; quick amounts (Rp10.000 / 20.000 / 50.000 / 100.000); live derived value under the amount (for us: balance after) | On-screen keypad on desktop (teller types on a keyboard); "." key (Rupiah has no decimals) |
| [Stripe — Create a payment](https://mobbin.com/screens/cc94c588-fe39-44ec-97c4-ba8451edc5df) | Full-page task with close (✕) and primary action top-right; one column of labelled fields | Task-focused page with the customer pinned as context | Secondary "Submit and create another" clutter |
| [Monarch — Add transaction](https://mobbin.com/screens/6ec46c9f-30f3-47c7-b30f-1d83d39ae59e) | Debit / Credit segmented switch at the top of the form; disabled primary until valid | Segmented **Setor / Tarik** switch as the first control | Long optional field list (date, tags, notes) we don't have |
| [Jobber — Collect payment](https://mobbin.com/screens/eb9b0f70-204c-4b70-8439-249b8b0e4b65) | "Client details · Account balance" shown inside the payment form | Show current balance next to the amount input | Three equal-weight buttons in the footer |

### 2. Balances and financial hierarchy

| Reference | Pattern | Adopt | Avoid |
| --- | --- | --- | --- |
| [Mercury — Home](https://mobbin.com/screens/d7aa120c-c488-4f38-bf61-78460910320d) | Balance large with smaller cents; money-in green, money-out neutral; quick actions as a row of small buttons | Green only for money **in**; money **out** stays ink-coloured, never red | Charts (no backend data for them) |
| [Monarch — Accounts](https://mobbin.com/screens/576f3af4-6978-419c-abdb-524a5b995ebd) | Section totals right-aligned on the header row; summary card on the right | Right-aligned, tabular numbers; totals on header rows | Promo cards in the sidebar |
| [Airwallex — Balances](https://mobbin.com/screens/adfc8a85-a15c-4405-b9ef-7136e216adba) | Dense table of balances, actions grouped top-right of the card | Action group anchored to the card it acts on | Marketing banner above the work |
| [Wise — Home](https://mobbin.com/screens/cb4fa4d4-d7b3-40ea-9a12-2a2498c2062d) | Yellow full-width alert for an action the user must take | One prominent alert slot for state that blocks work (shift rejected, shift not open) | Playful pastel card colours |

### 3. Customer lookup and identity panel

| Reference | Pattern | Adopt | Avoid |
| --- | --- | --- | --- |
| [Square — Customer directory + side sheet](https://mobbin.com/screens/ccd2da3f-ac32-4dc0-9b16-c873ab447a3c) | Search + table on the left, selected customer in a right-hand sheet | Lookup on the left, customer + transaction on the right; selection never leaves the page | Directory browsing (tellers may only look up one customer, backend L14) |
| [Stripe — Customer detail](https://mobbin.com/screens/1a4aa88b-e0be-49b2-a87f-1264e0b5e786) | Name as H1, "Details" column on the right, IDs in monospace with copy | Account number and NIS in monospace; key–value list for identity | Many sections we have no data for |
| [Shopify — Customer](https://mobbin.com/screens/bdacd18e-3af1-43fb-964e-d59299a27ce6) | KPI strip under the name (amount spent, orders, customer since) | A compact strip: **Saldo · Status · PIN** under the name | Timeline/comments |
| [Navattic — Visitor sheet](https://mobbin.com/screens/79a31934-4ca2-4700-86a5-c180fa735404) | Inline amber notice inside the detail sheet | Account warnings (ditangguhkan, PIN diblokir) inside the customer panel, not as toasts | — |

### 4. Waiting for the customer's approval on their phone (Mode A)

| Reference | Pattern | Adopt | Avoid |
| --- | --- | --- | --- |
| [Google — Verify it's you / Check your phone](https://mobbin.com/screens/bacd9e14-9ab3-4c8f-a50a-e85b986264a7) | Split card: context left, one large focal element right ("5"), short instruction "Check your phone", alternative action ("Try another way") | **The model for the waiting state:** context (customer, amount) left, large live countdown right, one-line instruction, secondary "Batalkan" | Number matching (backend has none) |
| [Mercury — Application timeline](https://mobbin.com/screens/2a7de612-6f88-42d7-bce5-1d8fe2219314) | Vertical step list: done / current / upcoming, with "no action needed on your end" | Three-step tracker: **Dikirim → Disetujui nasabah → Diselesaikan**, current step highlighted | Days-long tone; ours is a 2-minute live wait |
| [Airwallex — Verification stepper](https://mobbin.com/screens/5b2e67a8-ded8-496b-80f0-d2aa8ab4ae03) | Horizontal stepper with Completed / In review / Pending labels | Text label under each step, not colour alone | Product upsell below |
| [Fresha — Awaiting approval](https://mobbin.com/screens/31be8e16-efe1-46a8-b69d-7761f8227ee0) | Clock icon, headline "awaiting approval", details card, one "Done" button | Calm, non-alarming pending state | Leaving the flow before it resolves (teller must stay to hand over cash) |

### 5. Transaction history

| Reference | Pattern | Adopt | Avoid |
| --- | --- | --- | --- |
| [Mercury — Transactions](https://mobbin.com/screens/092df116-f17c-4ffe-89b6-4e2026e58168) | Failed rows: amount struck through + small red "Failed" tag; incoming amounts green; quick filter chips | Corrected rows: struck amount + "Dikoreksi" tag; filter chips (Semua / Setor / Tarik / Koreksi) | Card/method columns |
| [Stripe — Transactions](https://mobbin.com/screens/80054ec0-bb9d-4438-9a66-4f7bcd8f103f) | Status count tiles above the table that double as filters | Count tiles for the shift (Transaksi · Setor · Tarik · Koreksi) | Many columns and column editor |
| [Midday — Transactions](https://mobbin.com/screens/6ead266a-00ac-4779-ab2f-772183755698) | Plain gridded table, thin borders, status as quiet text | Thin 1px grid, quiet status text where colour isn't needed | Checkbox column (no bulk actions exist) |

### 6. Results and receipts

| Reference | Pattern | Adopt | Avoid |
| --- | --- | --- | --- |
| [Whop — Receipt paid](https://mobbin.com/screens/3be227fe-e941-420f-b49f-4b2808749c1b) | Small centred card: status, big amount, key–value rows, two buttons (Download receipt, …) | Result card: amount, terbilang, No. transaksi, saldo sebelum → sesudah; **Cetak struk** + **Transaksi baru** | Illustration |
| [Melio — Payment scheduled](https://mobbin.com/screens/1d9bfa79-45d3-46f7-aff4-026b7ed81af7) | Summary card with download + print icon buttons in the corner | Print as an explicit action on the result | Mascot illustration |
| [Deel — Payment confirmed](https://mobbin.com/screens/eb392439-083f-4863-b60b-baa13493780b) | "Processing" banner inside the summary, completed steps on the right | Reuse the step tracker on the withdrawal result (all three steps done) | — |
| [Fresha — Sale receipt](https://mobbin.com/screens/ba0558e0-590a-4eaa-8d20-0381e7c0e3af) | Receipt preview as a document with Download top-right | PDF opens in a new tab; the result screen doesn't preview it | — |

## Recurring patterns and why they work

1. **One focal number per task.** Fresha, Mercury, Whop and Google each make one value dominant
   (amount, balance, the code). At a counter the teller and the customer look at the same screen;
   one large amount is what both check.
2. **Context stays visible during the task.** Fresha keeps the cart, Jobber the client balance,
   Square the directory behind the sheet. The teller never loses sight of *which customer* and
   *how much they have*.
3. **Colour encodes meaning, sparingly.** Mercury: green only for money in; red only for
   failure. Everything else is ink on white. This is what makes these products read as
   trustworthy rather than decorative.
4. **Async states are explicit and stepwise.** Google, Mercury and Airwallex show where the
   process is and what (if anything) the user must do. That maps directly onto the
   `pending → approved → consumed` withdrawal authorization.
5. **Failure is shown in place, on the row or field it concerns.** Mercury's struck-through
   failed amounts and Navattic's inline notice keep errors next to their cause.
6. **Results are documents.** Whop/Melio present the outcome as a receipt-like card with print/
   download, which matches the 80 mm receipt PDF the backend produces.

## What to avoid (seen in results)

- Promo and upsell cards inside work surfaces (Airwallex Yield banner, Monarch "What's new").
- Charts and analytics that the backend has no data for.
- Pastel multi-colour cards (Wise jars) and illustration-led states (Melio, Etsy): friendly, but
  they lower the sense of precision a cash desk needs.
- On-screen numeric keypads on desktop (Fresha): slower than a keyboard for a seated teller.
- Gradient hero backgrounds (ClickUp verification): the generic look the brief asks to avoid.

## How this applies to Bank Mini

- **Counter layout:** left column = lookup + customer panel (Square/Stripe); right column =
  Setor/Tarik switch, amount, balance-after hint (Monarch/Jobber/Fresha).
- **Mode A withdrawal:** Google's split "check your phone" card + Mercury's step tracker + a
  countdown driven by `server_time → expires_at` / `approval_expires_at`. No PIN field anywhere.
- **Shift state:** one alert slot at the top of every teller page (Wise) for *Belum ada shift*,
  *Shift ditolak supervisor*, *Shift lama belum ditutup*.
- **History:** Mercury-style rows; corrected originals struck through with a tag; count tiles
  (Stripe) for the shift.
- **Results:** receipt-style card (Whop) with Cetak struk; replayed requests labelled "sudah
  tercatat sebelumnya".

---

## Round 2 — implementation research (2026-11-01)

Figma was dropped (MCP plan limits); the redesign goes straight into React. Four more
`search_screens` calls (web) filled the gaps for the app shell, review step, inline
validation and empty states. Every screen below was returned and looked at.

| # | Query | Screens inspected |
| --- | --- | --- |
| 10 | business banking web app with compact left sidebar navigation | [Mercury home](https://mobbin.com/screens/d575358b-679b-4d52-aa98-5026970291b3), [Revolut Business](https://mobbin.com/screens/79ac1b27-feba-4e55-8d5b-12faace3fe8b), [Square banking](https://mobbin.com/screens/28bf9565-ffa8-49df-bb6e-ec20f76341bd), [Wise](https://mobbin.com/screens/ede78e65-ca02-449f-96c0-f36420fe9281), [Airwallex](https://mobbin.com/screens/79d7713e-740c-42d9-93f3-1bbb2e47027a), [QuickBooks](https://mobbin.com/screens/5c8733eb-179e-4769-86ea-27f2ead941e7) |
| 11 | review and confirm transfer before sending | [Wise review](https://mobbin.com/screens/ced7c24f-5381-4d74-8c7c-313b54f94540), [Mercury review transfer](https://mobbin.com/screens/4f69e54d-7e1c-49c0-a0af-b5c5e583b7fb), [Revolut review](https://mobbin.com/screens/14836e01-df66-4ecf-83d0-9248b6b01cc5), [Airwallex review](https://mobbin.com/screens/44da3306-b21c-4314-857a-97765fc73c04), [Melio review & confirm](https://mobbin.com/screens/7382bfe2-2bbe-4353-8546-5319faec7cea), [Uniswap review send](https://mobbin.com/screens/41094cec-82c9-436e-884c-a8e5a3045157) |
| 12 | payment form with inline validation under the amount | [Vapi amount error](https://mobbin.com/screens/34766f43-7ba1-44a3-9c42-a20826230325), [Vercel card error](https://mobbin.com/screens/0a227055-0e20-4ef1-a4cf-08bd5e0d9c58), [NordVPN](https://mobbin.com/screens/aa0e3250-e3bc-4b6d-b24a-fcbe541aa107), [Expedia](https://mobbin.com/screens/a2482e64-ce4c-4fe5-96d6-6564c6cac70b), [Claude billing](https://mobbin.com/screens/34e3cb61-99c3-4184-a302-74d9b03bdd0e), [Visual Electric](https://mobbin.com/screens/7a509859-f82c-480f-8a12-b53de3dc6802) |
| 13 | transactions table empty state | [Mercury no transactions](https://mobbin.com/screens/9c0b1be4-b1f9-4d6b-8cfa-17bae36d2582), [Quicken](https://mobbin.com/screens/ad1be456-1bce-4e2f-a03a-ecdcee77c3fd), [Midday](https://mobbin.com/screens/024cfba0-4435-4a52-bc45-4a39ad71a6a3), [Rocket Money](https://mobbin.com/screens/d2250860-39bd-4ca6-ad58-40af70c02a4a), [Upwork](https://mobbin.com/screens/d4d5cfcb-4f7a-4345-82a5-385ffe9b004f), [Meetup](https://mobbin.com/screens/58275182-c6c1-44a1-9f54-7b24cdf367b9) |

### What each contributes

| Reference | Layout / hierarchy | Type & spacing | Why it works | Taken for Bank Mini |
| --- | --- | --- | --- | --- |
| Mercury home + empty table | ~200 px light sidebar, grouped nav, workspace name top-left; one "Move money" primary in the top bar | 13–14 px nav, generous row height, numbers right-aligned | The sidebar is quiet, so the work area leads; the one money action is always in the same place | Compact sidebar; one persistent primary action ("Layani nasabah"); skeleton rows behind the empty-state text so the table's shape stays visible |
| Airwallex / QuickBooks shell | Org/account context block at the top of the sidebar; user menu with sign-out | Small uppercase section labels | The "who and where am I" block is fixed, not a page element | Sidebar head = bank + **shift status block** (status, date, cash in drawer); teller identity + sign-out at the foot |
| Wise / Mercury review | Single column: one large amount, then key–value rows split by thin rules, one primary action at the bottom | Amount ~40 px semibold; labels muted 13 px left, values right | The reviewer checks one number and three facts; nothing else competes | Confirmation dialogs: amount first with terbilang, then rows (nasabah, rekening, saldo sekarang → sesudah), primary action last |
| Melio review & confirm | Sections with small caps headings inside one sheet, separated by 1 px rules, not separate cards | 11 px uppercase section labels | Structure without card stacking | Customer panel and receipt use ruled sections inside one surface |
| Vapi / Vercel / NordVPN validation | Error text directly under the field, red border on the field, primary stays visible (sometimes disabled) | 12–13 px red text, icon optional | The cause and the message are in one glance | Amount errors under the amount; business refusals inside the panel they refuse |
| Quicken / Midday / Rocket Money empty | One sentence + one action, no illustration (Upwork/Meetup add art) | Muted 14 px | Calm, operational | Empty states are a sentence and, at most, one action; no illustrations |

### Principles carried into the implementation

1. **Quiet chrome, loud work.** Sidebar ≤ 232 px, neutral; the counter's amount and the
   customer's balance are the largest things on screen.
2. **One focal number per task** (amount on entry, review, waiting and receipt).
3. **Ruled sections, not stacked cards.** One surface per task with 1 px rules inside.
4. **State lives where it applies:** shift state in the shell, field errors under fields,
   approval status inside the withdrawal panel.
5. **Colour = meaning only:** green money in / success, red error, amber waiting/warning,
   navy = brand and primary action.
6. **Empty and loading states keep the layout's shape** (skeleton rows, same headers).
