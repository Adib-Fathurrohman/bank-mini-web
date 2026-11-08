# Deployment

The staff web app is a static build (`dist/`). Nginx serves it at
**https://bank.rumput.tech/api/**. It calls the Laravel API at
**https://api-bank.rumput.tech/api**, which deploys from its own repository (`bank-mini-laravel`,
`docs/DEPLOY.md` there). The customer app is the Android app in `bank-mini-mobile`.

A release goes through three steps:

1. Tag `vX.Y.Z` on `main`.
2. Build the tagged commit on your computer and publish the build with `gh` as a GitHub Release.
3. Run `deploy-staff.sh X.Y.Z` on the VPS. It downloads that release asset.

GitHub Actions is not used (see [Legacy](#legacy)).

## VPS layout

| Path | What |
| --- | --- |
| `/var/www/rumput/bank-mini/staff/releases/vX.Y.Z/` | One folder per release, contents of `dist/` (owner `rumput`, dirs 755, files 644) |
| `/var/www/rumput/bank-mini/staff/current` | Symlink to the active release, switched atomically |
| `/var/www/rumput/bank-mini/bin/deploy-staff.sh`, `rollback-staff.sh` | Copies of [deploy/server/](deploy/server/) |
| `/var/www/rumput/bank-mini/tmp/` | Downloads; `tmp/acme` is the ACME webroot |
| `/etc/nginx/sites-available/bank.rumput.tech` | [deploy/server/bank.rumput.tech.conf](deploy/server/bank.rumput.tech.conf), symlinked into `sites-enabled/` |
| `/var/www/rumput/bank-mini/api/` | The backend. This repository never touches it |

## Where the app is served (`/api/`)

The production build uses the Vite base `/api/` ([vite.config.ts](vite.config.ts)). The router's
basename comes from `import.meta.env.BASE_URL`, so the router and the asset paths share one
setting. `npm run dev` still serves at `/`, with `/api` proxied to the local backend.

To serve the app at the site root instead, build with `VITE_BASE_PATH=/`. Then change the
`/api/` locations in the vhost to `/`.

## 1. Build and publish a release (your computer)

You need Node.js 24+, `gh` (logged in) and a clean `main`.

```bash
git tag -a v0.1.0 -m "v0.1.0" && git push origin main v0.1.0

V=0.1.0
rm -rf /tmp/staff-build && git clone --depth 1 --branch v$V https://github.com/Adib-Fathurrohman/bank-mini-web /tmp/staff-build
cd /tmp/staff-build
npm ci && npm test
VITE_API_BASE_URL=https://api-bank.rumput.tech/api npm run build

# Checks: the API URL is in the bundle, there are no dev URLs and no source maps
grep -rq 'https://api-bank.rumput.tech/api' dist/assets && ! find dist -name '*.map' | grep -q .

NAME=rumput-bank-mini-staff-v$V
COPYFILE_DISABLE=1 tar --no-mac-metadata --no-xattrs -czf $NAME.tar.gz -C dist .
shasum -a 256 $NAME.tar.gz > $NAME.tar.gz.sha256
gh release create v$V $NAME.tar.gz $NAME.tar.gz.sha256 --repo Adib-Fathurrohman/bank-mini-web \
  --verify-tag --prerelease --title "Staff web v$V" --notes "..."
```

Write down the SHA-256. After publishing, download the asset from its public URL and check
it with `shasum -a 256 -c`.

`VITE_API_BASE_URL` must include the trailing `/api`, because the client appends paths such
as `/staff/me`. Without it, the build falls back to `/api`, which on this site is the app
itself.

## 2. Deploy on the VPS

The first time only, install the scripts:

```bash
scp deploy/server/deploy-staff.sh deploy/server/rollback-staff.sh root@rumput.tech:/var/www/rumput/bank-mini/bin/
ssh root@rumput.tech 'chmod 750 /var/www/rumput/bank-mini/bin/*-staff.sh'
```

Each release:

```bash
ssh root@rumput.tech /var/www/rumput/bank-mini/bin/deploy-staff.sh 0.1.0 <recorded-sha256>
```

The script does the following:

- Downloads the asset and its `.sha256` into `tmp/` and verifies both checksums.
- Extracts into a new `releases/vX.Y.Z`. It refuses to run if that folder already exists.
- Sets the owners and permissions.
- Refuses dotfiles, source maps, source files, or a build without the production API URL.
- Switches `current`.

Nothing is restarted. Open tabs keep working because hashed files of older releases stay
on disk in their own release folders.

### First time: nginx and HTTPS

DNS: `A bank → 179.197.249.250` (DNS only). Check it with `dig +short bank.rumput.tech @1.1.1.1`.

1. Install a port-80-only copy of the vhost, which is the first `server` block. It serves
   `/.well-known/acme-challenge/` from `tmp/acme`.
2. Run `nginx -t && systemctl reload nginx`.
3. Get the certificate:

   ```bash
   certbot certonly --webroot -w /var/www/rumput/bank-mini/tmp/acme -d bank.rumput.tech
   ```

4. Install the full [bank.rumput.tech.conf](deploy/server/bank.rumput.tech.conf).
5. Run `nginx -t && systemctl reload nginx` again.

Certbot renews the certificate through the same webroot.

What the vhost does:

| Request | Result |
| --- | --- |
| `/` | 302 → `/api/` |
| `/api` | 301 → `/api/` |
| `/api/`, `/api/<any route>` | `index.html` (`Cache-Control: no-cache`) |
| `/api/assets/<hashed file>` | The file, `Cache-Control: public, max-age=31536000, immutable`; 404 if missing |
| `/api/favicon.svg` | The file |
| Dotfiles (`/.env`, `/api/.env`) | 403 |
| Anything else | 404 |

The vhost also enables gzip for text types and sends `X-Content-Type-Options: nosniff`,
`Referrer-Policy` and HSTS. It sends no `Permissions-Policy` header, so the teller's camera
(QR scanner) is allowed. The scanner needs HTTPS.

## Roll back

```bash
ssh root@rumput.tech /var/www/rumput/bank-mini/bin/rollback-staff.sh 0.0.9
```

This points `current` at an existing older release. No reload is needed.

## Checks

```bash
curl -sI https://bank.rumput.tech/api/            # 200, text/html, no-cache
curl -sI https://bank.rumput.tech/api/teller      # 200 (client route)
curl -sI https://bank.rumput.tech/api/assets/nope.js   # 404
curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS https://api-bank.rumput.tech/api/staff/me \
  -H 'Origin: https://bank.rumput.tech' -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization'   # 204
```

| Symptom | Cause |
| --- | --- |
| Blank page, assets 404 | The build was made without the `/api/` base, or the `alias` paths are wrong |
| Every request fails with a CORS error | The API only allows the origin `https://bank.rumput.tech` |
| Requests go to `bank.rumput.tech/api/...` and return HTML | Built without `VITE_API_BASE_URL` |
| The camera does not start at the counter | The site is not on HTTPS |

## Legacy

These files belong to the old layout: one server, with `/api` proxied to Laravel on
`bank.rumput.tech` and the app in `/var/www/bank-mini-frontend`. They are **not used**
and must not be run:

- [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml). It deploys on a push to
  `production`, and GitHub Actions is disabled for this account. Do not push `production`.
- [deploy/deploy.sh](deploy/deploy.sh) (rsync upload) and
  [deploy/nginx/bank.rumput.tech.conf](deploy/nginx/bank.rumput.tech.conf).
