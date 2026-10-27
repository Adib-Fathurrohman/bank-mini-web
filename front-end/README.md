# E-Teller Bank Mini — staff web app

React web app for the school mini bank's staff (Administrator, Supervisor,
Teller). It talks to the Laravel API in `~/school/ukk/bank-mini-laravel`
(docs in its `docs/` folder). The customer mobile app (Expo) is a separate
project.

Architecture, API integration rules and the build plan:
[docs/FRONTEND_AUDIT.md](docs/FRONTEND_AUDIT.md).

## Stack

Vite · React 19 · TypeScript · React Router · TanStack Query · Tailwind CSS 4 · Vitest

## Run locally

1. Start the backend (from the backend repo):

   ```bash
   php artisan serve --port=8000
   ```

2. Install and start the web app:

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:5173. Vite proxies `/api` to `http://localhost:8000`,
   so the app and the API are same-origin in development.

Demo accounts come from the backend seeder (see the backend `README.md`).

## Configuration

Copy `.env.example` to `.env` to override:

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | API base URL as seen by the browser |
| `VITE_BACKEND_URL` | `http://localhost:8000` | Dev server only: where the `/api` proxy forwards |

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with the API proxy |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Typecheck + production build into `dist/` |

## Layout

```text
src/
├── api/         HTTP client, error model, contract types, endpoint functions
├── auth/        session storage, AuthProvider, role guards
├── components/  shared UI pieces
├── layouts/     staff shell and per-role navigation
├── lib/         money, terbilang, WIB dates, denominations, idempotency keys, PDF helpers
└── features/    pages per area (auth, teller, ...)
```

## Session behaviour

- The token is kept in `sessionStorage`; closing the browser ends the session.
- On load the stored token is re-checked with `GET /staff/me`.
- Any `401` or role `403` from the API logs the user out and returns to the login page.
- Opening another role's page (e.g. `/admin` as a teller) also logs out (UKK rubric 3.2).
