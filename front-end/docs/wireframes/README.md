# Wireframes — E-Teller Bank Mini

Low-fidelity, greyscale wireframes for every role. They follow the backend as of
`b2eb9d8` (customer Firebase login, admin-entered customer email, withdrawals approved in
the customer app). They are not the real visual design.

| File | Role | Size | Screens |
| --- | --- | --- | --- |
| `teller.html` | Teller (web) | 1280 × 800 | S-01, T-01 – T-13 |
| `supervisor.html` | Supervisor (web) | 1280 × 800 | S-01, V-01 – V-11 |
| `admin.html` | Admin (web) | 1280 × 800 | S-01, A-01 – A-15 |
| `customer-app.html` | Customer (mobile app) | 375 × 812 | C-01 – C-17 |

Each screen is one fixed-size box with a caption above it (code, name, one-line purpose).
Some web screens are taller than 800 px where the content needs it.

## Importing into Figma

The pages are plain HTML and CSS: flexbox only (imports as auto layout), real text, no
JavaScript, no web fonts (Inter, which Figma has, with Arial as the browser fallback).

1. Open a page in the browser: open the file directly, or with `npm run dev` running,
   go to `http://localhost:5173/docs/wireframes/teller.html`.
2. Import it with a code-to-design tool, for example the **html.to.design** Figma plugin
   with its browser extension (works on local pages), or Figma's own capture / MCP
   `html_to_figma`.
3. Import one file at a time; each becomes a frame whose children are the screens.

## Editing

The HTML is generated. Change `generate.py`, then run it:

```bash
python3 docs/wireframes/generate.py
```
