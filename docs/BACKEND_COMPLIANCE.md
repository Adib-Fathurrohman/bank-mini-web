# Backend compliance (frontends vs bank-mini-laravel `ebdb181`)

> Since this audit, `mobile-app/` moved to its own repository, `bank-mini-mobile` (same
> paths inside it, without the `mobile-app/` prefix).

Audit of `front-end/` (staff web app) and `mobile-app/` (customer app) against
`bank-mini-laravel` `main` at `ebdb181`. Sources: `docs/FRONTEND_HANDOFF.md`, `docs/API.md`,
`docs/API_SUMMARY.json` (74 endpoints), `docs/CUSTOMER_AUTH.md`, `docs/UI_REQUIREMENTS.md`, and
where docs and code could differ, the code: `routes/api.php`, the form requests, resources,
exceptions and `app/Providers/AppServiceProvider.php` (rate limits).

Since the previous catch-up (`55d2bcf`, frontend commit `8c985f8`) the backend added one
feature: **push notifications** (`278ac17`): `POST/DELETE /api/customer/push-tokens` and an FCM
push for every new withdrawal request.

## 1. Endpoints

Every call both apps make exists in `API_SUMMARY.json` with the same method, path and role.

| App | Calls | Not called (on purpose) |
| --- | --- | --- |
| Staff | every staff endpoint in `front-end/src/api/endpoints/*.ts` (deposits, corrections and `.../complete` go through `recordMoney` in `teller.ts` with an `Idempotency-Key`) | `POST /teller/withdrawals` (Mode B: the teller would type the customer's PIN; the staff UI never handles the PIN), `GET /supervisor/cash-transfers/{id}` (the list shows everything needed), the `POST /staff/login` alias (`/login` is used) |
| Customer | 17 endpoints (`mobile-app/src/api/customer.ts`, `src/lib/download*.ts`) | none |

## 2. Staff web app (`front-end/`)

All items in the brief already matched (they were done for backend `55d2bcf`); no change needed.

| Item | Where | Backend | Status |
| --- | --- | --- | --- |
| New customer: email required, no PIN field, starts pending / `pin_set: false`, next steps shown | `src/features/admin/CustomerFormPage.tsx`, `src/features/directory/AppStatusNotice.tsx` | `StoreCustomerRequest` (pin prohibited), API.md `POST /admin/customers`, UI_REQUIREMENTS "Open account" | OK, verified against the backend (§5) |
| Edit customer: email editable only while pending, no PIN | `CustomerFormPage.tsx:110` (`emailLocked`) | `UpdateCustomerRequest`, UI_REQUIREMENTS "Edit account" | OK |
| Reset PIN button, no PIN input | `src/features/admin/CustomerActions.tsx` (`ResetPinDialog`), `src/api/endpoints/admin.ts:88` | `POST /admin/customers/{id}/pin-reset` | OK |
| List/detail show `activation_status` and `pin_set`; filter `activation` | `src/features/directory/CustomersPage.tsx`, `CustomerDetailPage.tsx`, `src/features/teller/labels.ts` (`appState`) | `GET /customers?activation=pending\|activated`, `CustomerResource` | OK, verified |
| Teller lookup uses `activation_status` / `pin_set`; withdrawal disabled when pending or no PIN | `src/features/teller/components/CustomerPanel.tsx`, `src/features/teller/CounterPage.tsx` (`blockerFor`) | `CustomerSummaryResource`, FRONTEND_HANDOFF §15.3, §15.5 | OK, verified |
| `422 customer_app_not_activated` / `422 pin_not_set` handled | `src/api/errors.ts` (keeps `code`), `src/features/teller/components/CounterDialogs.tsx` (`CUSTOMER_STATE_CODES`: message shown, lookup refreshed) | `CustomerAppNotActivatedException`, `PinNotSetException` | OK, refusal verified (§5). Only Mode A exists in the UI (see §6) |
| Withdrawal approval and polling (§15.5 A) | `src/features/teller/withdrawalAuthorization.ts:19` (`POLL_INTERVAL_MS = 2000`), resume via `?status=open`, cancel, complete | API.md "Withdrawal authorizations" | OK |
| Errors §10 incl. `code`, rate limits | `src/api/errors.ts`, `src/api/client.ts` | `bootstrap/app.php` renderers, `AppServiceProvider` limits | OK: 401/403 end the session except the admin-account 403; 409 offers "Blokir saja"; 422 field / business / `code`; 429 generic message; 5xx never shows the body |

Note: `front-end/src/api/endpoints/auth.ts:19` revokes a customer token if `/login` ever
answered `actor: "customer"`. With the staff form (username only) the backend never does
(`LoginController`), so this is defensive only; kept.

## 3. Customer app (`mobile-app/`): mismatches found and fixed

| # | File:line (now) | Mismatch | Backend expects | Fix |
| --- | --- | --- | --- | --- |
| C1 | (missing) | No push notifications | FRONTEND_HANDOFF §15.11, CUSTOMER_AUTH §12: register the FCM token, react to `data.type = withdrawal_authorization` | Added React Native Firebase push: `src/push/` (§4) |
| C2 | `src/features/queries.ts:68-86` | Open requests were polled every 4 s on every screen | §15.11 / UI_REQUIREMENTS "Withdrawal approval": learn from the push; poll every 3–5 s **only while the approvals screen is open**; also check on start and foreground | `useOpenApprovals` no longer polls on phones (start, foreground and push refresh it); new `useApprovalsScreen` polls every 4 s only while the new **Persetujuan** tab is focused (`src/app/(app)/(tabs)/approvals.tsx`). The web build has no push and keeps polling (see §6) |
| C3 | `src/api/client.ts:74` | Every 401 ended the session, including `401 firebase_token_invalid` from `POST /customer/pin/setup`; a 403 never did | §10: 401/403 → log out; but refusals with a `code` concern the Firebase sign-in or PIN (§15.10). `EnsureCustomer` aborts 403 without a code for a closed account | Session ends on 401/403 **without** `code`, with the backend message on the sign-in screen (`src/session/SessionProvider.tsx` `setSessionEndedHandler`) |
| C4 | `src/app/activate.tsx:13,37-44` | Own texts replaced the backend messages; `firebase_token_invalid`, `provider_not_allowed`, `account_inactive` left the student on the form | §15.10 "Activation screen": sign in again for those codes; show `message` | Backend `message` shown as returned; those three codes sign out of Firebase and return to sign-in with the message |
| C5 | `src/app/create-pin.tsx:39` | `identity_mismatch` showed an own text | §15.10 "PIN creation screen" | Backend `message` shown; "Masuk lagi" offered for `identity_mismatch` / `firebase_token_invalid` (unchanged) |
| C6 | `src/app/(app)/change-pin.tsx:45` | `422 pin_not_set` (PIN reset meanwhile) showed a message and restarted | §15.10 table: `pin_not_set` → create the PIN first | Reloads the customer; the session moves to PIN creation |
| C7 | `src/app/(app)/approval/[id].tsx:70` | `422 pin_not_set` on approve only showed "buka ulang aplikasi" | same | Reloads the customer → PIN creation |

Checked and already matching: sign-in (`src/app/sign-in.tsx`, `src/session/firebaseAuth.ts`:
`account_not_linked` → activation, `email_not_verified` → verification,
`account_inactive` / `firebase_token_invalid` / `provider_not_allowed` → Firebase sign-out,
`auth_unavailable` message, 429), activation `POST /customer/activation {nis, id_token}` with a
fresh token, PIN creation `POST /customer/pin/setup {id_token (fresh), pin, pin_confirmation}`
after activation and whenever `pin_set` is false, `pin_already_set` → unlock, unlock with
`remaining_attempts` / lock / `pin_not_set`, PIN change, logout and logout-all (Firebase
sign-out, token deleted even on failure), session expiry from `expires_at` (no refresh endpoint)
on start and on return to the foreground, approve with PIN / reject, `status` refusals, the
server-clock countdown.

## 4. Push notifications (added)

| Requirement (§15.11) | Implementation |
| --- | --- |
| React Native Firebase, not Expo push | `@react-native-firebase/app`, `@react-native-firebase/messaging` 27.1; no `expo-notifications` / `getExpoPushTokenAsync` |
| Native config | `app.json`: `googleServicesFile` (Android, iOS), plugins `@react-native-firebase/app`, `@react-native-firebase/messaging`, `expo-build-properties` `{ios: {useFrameworks: "static"}}`, Android permission `POST_NOTIFICATIONS`, iOS background mode `remote-notification`; `expo-dev-client` |
| Firebase apps | Registered with the Firebase CLI in `bank-mini-rumput`: Android `1:418347097835:android:9c42c9380716171bdfe8ae`, iOS `1:418347097835:ios:52011a94debd30a7dfe8ae` (`tech.rumput.bankmini`). Config files: `mobile-app/google-services.json`, `mobile-app/GoogleService-Info.plist` (no private keys) |
| Permission after sign-in once the PIN exists | `src/push/messaging.native.ts` `requestPushPermission` (Android 13+ `POST_NOTIFICATIONS`, iOS `requestPermission`); refusal is fine |
| Register token after login/PIN, every start, on refresh | `src/push/PushManager.tsx` (runs while the session is `locked` or `ready` with `pin_set`), `src/push/register.ts`, `src/api/customer.ts:95` |
| "Notifikasi" switch → `DELETE /customer/push-tokens {token}` | `src/push/NotificationSwitch.tsx` on the account screen; preference in `src/push/preference.ts` |
| Logout: no extra call | unchanged (server deletes the token with the session) |
| Foreground `onMessage`: banner + refresh approvals | `PushManager` banner (8 s, tap opens the request), invalidates the approvals query |
| Background tap / cold start: open through session checks | `onNotificationOpenedApp`, `getInitialNotification` → `src/push/pendingRequest.ts` holds the id → `src/app/(app)/_layout.tsx` opens `/approval/{id}` only once the app is unlocked (`stage === 'ready'`, after sign-in / PIN creation / PIN unlock) → `GET /customer/withdrawal-authorizations/{id}` |
| Never approve from the notification | approval always on the approval screen with the PIN pad |
| Background handler | `index.js` (custom entry) loads `src/push/background.native.ts` (no-op `setBackgroundMessageHandler`) before Expo Router |
| Web build compiles without push | `src/push/messaging.ts` / `background.ts` are no-ops; React Native Firebase is only imported from `.native.ts` files (web bundle checked: no React Native Firebase code) |

## 5. Verification (3–4 Nov 2026)

**Checks**

| Command | Result |
| --- | --- |
| `front-end`: `npm test` | 14 files, 80 tests passed |
| `front-end`: `npm run build` | built |
| `mobile-app`: `npm run typecheck`, `npm run lint` | clean |
| `mobile-app`: `npm run build:web` | exported; no React Native Firebase code in the web bundle |
| `mobile-app`: `npx expo export --platform android`, `npx expo prebuild --platform android`, `./gradlew assembleDebug` | built (development build with `expo-dev-client`) |

No test runner exists in `mobile-app/`, so no unit tests were added there.

**Against the real backend** (`bank-mini-laravel` `ebdb181`, `php artisan serve` on localhost,
separate SQLite test database created with `migrate --seed`, never `ukk_laravel`; FCM with the
real `bank-mini-rumput` service account). Firebase **sign-in** ran against the local Firebase
Auth emulator (backend started with `FIREBASE_AUTH_EMULATOR_HOST`), because a real-project
sign-in needs a verified inbox; push used real FCM. Phone: Android emulator, API 36 with
Google Play, development build.

| Flow | Result |
| --- | --- |
| Admin opens an account (email, no PIN) | 201, pending, next steps shown |
| Customer list `?activation=pending` | filtered by the backend |
| Teller lookup, pending customer | "Belum aktivasi", withdrawal blocked; `POST /teller/withdrawal-authorizations` answers `422 customer_app_not_activated` with the message the UI shows |
| Deposit | recorded |
| App: create account, email verification, `POST /customer/auth/login` → `403 account_not_linked` → activation screen | as specified |
| Activation with a wrong NIS | `403 activation_mismatch`, backend message shown |
| Activation with the right NIS → PIN creation (`/customer/pin/setup` with a fresh token) | session started, PIN created |
| Notification permission (Android 13+) after the PIN | asked; granted |
| `POST /customer/push-tokens` | real FCM token stored (`android`, tied to the session) |
| Teller requests a withdrawal, app in the foreground | FCM push received, in-app banner with the backend title and body; tap opens the request |
| Approve with PIN → teller completes (2 s polling) | `approved` → `consumed`, balance 100.000 → 80.000 |
| App in the background, new request | system notification with the backend text; tap opens that request |
| Reject | `rejected` |
| Notification tapped while the app is locked | PIN unlock first, then that request opens |
| "Notifikasi" off / on | `DELETE` removes the server token ("Notifikasi dimatikan…"), `POST` adds it again ("Notifikasi aktif…") |
| Polling | home screen: no `GET /customer/withdrawal-authorizations`; Persetujuan tab: every 4 s |

**Not verified**

- **Cold start from a notification** (app process killed): the development client crashes in
  this case (`DevLauncher: App react context shouldn't be created before`, the push wakes the
  app's background handler before the tap starts the screen). This comes from
  `expo-dev-client`, which release builds do not contain. The same code path (`getInitialNotification`
  → pending id → opened after unlock) was verified with the background tap while locked; it
  should be checked once on a release or preview build.
- iOS (no Xcode here; also needs the APNs key), Google sign-in on phones (not implemented),
  real-project Firebase sign-in on a phone.

## 6. Decisions and limits

- **Mode B (`POST /teller/withdrawals` with the PIN at the counter)** is not in the staff UI by
  design: the teller must never enter or see the customer's PIN. With
  `withdrawal_verification = terminal` the counter explains that withdrawals stop.
- **Web build of the customer app** has no push (the backend accepts only `android` / `ios`),
  so it keeps polling open requests every 4 s on every screen, as before. Phones poll only on
  the approvals screen.
- **Google sign-in on phones** is still web-only: it needs `@react-native-google-signin` and the
  Android signing-key SHA-1/SHA-256 registered on the Firebase Android app. Email/password works
  on phones.
- **Notification icon (Android):** the system uses the app icon; a monochrome
  notification icon can be added later.

## 7. Backend notes

1. **Push text doubles the word "Teller"** when the teller's name already starts with it:
   `WithdrawalAuthorizationService::create()` builds `'Teller '.$authorization->teller->full_name`,
   and the seeded teller is "Teller Loket 1", so the notification reads "Teller Teller Loket 1
   meminta persetujuan…" (`app/Services/WithdrawalAuthorizationService.php`, the `defer()` call
   added in `278ac17`). Cosmetic; shown as returned by the app.
2. `docs/FRONTEND_HANDOFF.md` §15.11 example uses `id.rumput.bankmini`; the real IDs are
   `tech.rumput.bankmini` (the doc says it is an example; no change needed, noted for clarity).

No mismatch between the docs and the code was found for the endpoints the apps use.
