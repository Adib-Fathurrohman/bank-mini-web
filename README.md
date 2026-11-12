# E-Teller Bank Mini: staff web app

Web app for the staff of a school mini bank: **Administrator**, **Supervisor** and
**Teller**. Students use the separate customer app.

| Part | Repository |
| --- | --- |
| Staff web app (this repository) | `bank-mini-web` → https://bank.rumput.tech/api/ |
| API (Laravel) | `bank-mini-laravel` → https://api-bank.rumput.tech/api |
| Customer app (Expo, Android) | `bank-mini-mobile` → APK on its GitHub Releases page |

## What each role does

| Role | Pages |
| --- | --- |
| Teller | open the shift with the drawer count, serve customers (deposit with the notes received, withdrawal approved by the customer in their app and paid out note by note, QR lookup), the drawer per denomination, corrections, close the shift (a refusal lists the notes that differ), shift history and PDFs |
| Supervisor | dashboard, review daily reports (approve, hold, reject), vault ledger, customers, staff, forgotten-PIN requests (read only), history of graduations and class promotions (print slips), audit log, journal, reports |
| Administrator | dashboard, open and edit customer accounts, reset PINs at the counter, approve or reject forgotten-PIN requests from the app, print cards, **Kelulusan** (pay out and close a graduating class, print the slips), **Kenaikan Kelas** (move X and XI up a class once a year), staff (add, edit with an optional email, block, import from Excel/CSV), settings, audit log, journal, reports |
| Everyone | **Profil saya**: own email (verified through a link) and password; **Lupa password?** on the login page (reset link by email) |

The teller never enters or sees a customer's PIN: withdrawals are approved by the student
in the customer app.

## Stack

Vite · React 19 · TypeScript · React Router · TanStack Query · Tailwind CSS 4 · Vitest

## Run locally

1. Start the API (in the `bank-mini-laravel` folder):

   ```bash
   php artisan serve --port=8000
   ```

2. Install and start the web app:

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:5173. Vite forwards `/api` to `http://localhost:8000`, so the app
   and the API share one origin in development.

Demo accounts come from the API's seeder (`admin`, `supervisor`, `teller`, password
`password`). Change or remove them before real use.

## Configuration

Copy `.env.example` to `.env` to override:

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | API base URL as seen by the browser, including `/api`. Production: `https://api-bank.rumput.tech/api` |
| `VITE_BACKEND_URL` | `http://localhost:8000` | Development only: where the `/api` proxy forwards |
| `VITE_BASE_PATH` | `/api/` | Build only: the path the app is served under (`/` for the site root) |

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server with the API proxy |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Type check and production build into `dist/` (served under `/api/`) |
| `npm run preview` | Serve `dist/` locally at http://localhost:4173/api/ |

## Layout

```text
src/
├── api/         HTTP client, error model, API types, endpoint functions
├── auth/        session storage, AuthProvider, role guards
├── components/  shared UI pieces
├── layouts/     staff shell and per-role navigation
├── lib/         money, terbilang, WIB dates, denominations, idempotency keys, PDF helpers
└── features/    pages per area (auth, teller, supervisor, admin, audit, directory)
deploy/
├── server/                   deploy-staff.sh, rollback-staff.sh, nginx vhost (used)
├── deploy.sh                 legacy, not used
└── nginx/                    legacy, not used
```

## Cash per denomination

Shifts opened from backend v0.3.0 track the drawer note by note (`cash_tracked`). The teller
enters the notes received for a deposit and the notes paid out for a withdrawal (both must add
up to the amount; "Isi otomatis" fills the largest notes the drawer allows). Older shifts keep
the total-only flow. Helpers and tests: `src/lib/denominations.ts`.

## Graduation and class promotion

`Kelulusan` previews a class, pays every account in full from the main vault and closes it
(all or nothing), then prints one slip per student. `Kenaikan Kelas` runs once a year after
class XII graduated; students ticked "Tinggal kelas" stay. Both keep a history that
supervisors can read.

## Staff email and password

The link in the verification email opens `/login?email_verified=1`; the reset link opens
`/reset-password?token=…&email=…`. Both are client routes under the app's base path
(`/api/` in production), so the nginx `try_files` fallback already serves them.

## Session behaviour

- The token is kept in `sessionStorage`; closing the browser ends the session.
- On load the stored token is checked again with `GET /staff/me`.
- Any `401`, or a `403` for the role, logs the user out and returns to the login page.
- Opening another role's page (e.g. `/admin` as a teller) also logs out (UKK rubric 3.2).

## Deployment

Releases are built locally from a version tag, published as a GitHub Release with `gh`,
and installed on the VPS with `deploy-staff.sh`. See [DEPLOY.md](DEPLOY.md). The GitHub
Actions workflow is legacy and is not used.
