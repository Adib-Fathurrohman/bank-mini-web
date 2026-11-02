# Deployment (web apps)

This repository holds the two web front ends. The Laravel API deploys from its own
repository (`bank-mini-laravel`, `docs/DEPLOY.md`); do that first.

| Site | Built from | Server folder | API |
| --- | --- | --- | --- |
| https://bank.rumput.tech | `front-end` (staff: admin, supervisor, teller) | `/var/www/bank-mini-frontend` | `/api` on the same origin |
| https://app.rumput.tech | `mobile-app` web build (students) | `/var/www/bank-mini-app` | `/api` on the same origin |

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs on every push and
pull request to `main` and `production`: tests and production build of the staff app,
typecheck, lint and web build of the customer app. A push to **`production`** that
passes is uploaded to the VPS with rsync over SSH. Nothing else on the server is
touched, and nothing is restarted: nginx serves the new files at once.

## 1. DNS

At the DNS host of `rumput.tech` (Hostinger), add for **both** `bank` and `app`:

| Type | Name | Value |
| --- | --- | --- |
| A | `bank` / `app` | `179.197.249.250` |
| AAAA | `bank` / `app` | `2a02:4780:5e:7723::1` |

(The same addresses as `rumput.tech`.) Check with `dig +short bank.rumput.tech`.

## 2. GitHub settings

Repository → Settings → Environments → **`production`**, with the **same secrets as the
backend repository**:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | `rumput.tech` |
| `DEPLOY_USER` | SSH user, e.g. `root` |
| `DEPLOY_SSH_KEY` | Private deploy key (the same key as the backend is fine) |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan rumput.tech` (optional but recommended) |

Variables (optional):

| Variable | Default |
| --- | --- |
| `STAFF_WEB_PATH` | `/var/www/bank-mini-frontend` |
| `CUSTOMER_WEB_PATH` | `/var/www/bank-mini-app` |
| `DEPLOY_PORT` | `22` |

## 3. nginx and HTTPS (once)

The Laravel server setup (PHP-FPM, database, `.env`) is in the backend's DEPLOY.md.
Then, on the VPS:

```bash
cp deploy/nginx/bank.rumput.tech.conf /etc/nginx/sites-available/bank.rumput.tech
cp deploy/nginx/app.rumput.tech.conf /etc/nginx/sites-available/app.rumput.tech
ln -s /etc/nginx/sites-available/bank.rumput.tech /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/app.rumput.tech /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d bank.rumput.tech -d app.rumput.tech   # after DNS resolves
```

HTTPS is required: the teller's camera QR scanner and Firebase sign-in only work on a
secure origin. Both domains are already in Firebase's authorized domains.

## 4. First deploy

```bash
git push origin production
```

Watch it under **Actions**. Then open https://bank.rumput.tech (staff) and
https://app.rumput.tech (students).

Later deploys: merge `main` into `production` and push.

## Checks

| Symptom | Cause |
| --- | --- |
| Deploy fails at "Configure SSH" or `Permission denied (publickey)` | Secrets missing in the `production` environment, or the key not in the server's `authorized_keys` |
| Page loads, every request fails | The API is not deployed yet, or nginx is missing the `/api` block |
| 404 on reload of a deep link | nginx is missing `try_files ... /index.html` |
| Google sign-in popup error `auth/unauthorized-domain` | The domain is not in Firebase's authorized domains |
| Camera does not start at the counter | The site is not on HTTPS |
