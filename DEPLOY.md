# Deployment

The staff web app is a static build (`dist/`) served by nginx at
**https://bank.rumput.tech**, with `/api` sent to Laravel on the same origin. Deploy the
API first (`bank-mini-laravel`, its `docs/DEPLOY.md`). The customer app deploys from
`bank-mini-mobile`.

| What | Where on the VPS |
| --- | --- |
| This app (`dist/`) | `/var/www/bank-mini-frontend` |
| Laravel API | `/var/www/bank-mini-laravel` |

There are two ways to deploy; both run [deploy/deploy.sh](deploy/deploy.sh), which builds,
tests and uploads in two passes so open pages keep working. Nothing on the server is
restarted.

## 1. Once: DNS, nginx, HTTPS

**DNS** (Hostinger, zone `rumput.tech`):

| Type | Name | Value |
| --- | --- | --- |
| A | `bank` | `179.197.249.250` |
| AAAA | `bank` | `2a02:4780:5e:7723::1` |

Check with `dig +short bank.rumput.tech`.

**nginx** on the VPS, using [deploy/nginx/bank.rumput.tech.conf](deploy/nginx/bank.rumput.tech.conf)
(serves `dist/`, sends `/api` and `/up` to PHP-FPM):

```bash
cp deploy/nginx/bank.rumput.tech.conf /etc/nginx/sites-available/bank.rumput.tech
ln -s /etc/nginx/sites-available/bank.rumput.tech /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d bank.rumput.tech     # after DNS resolves
```

HTTPS is required: the teller's camera QR scanner only works on a secure origin.

## 2a. Automatic: GitHub Actions

[.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) tests and builds every push and
pull request to `main` and `production`. A push to **`production`** that passes is deployed.

Repository → Settings → Environments → **`production`**, with the same secrets as the other
two repositories:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | `rumput.tech` |
| `DEPLOY_USER` | SSH user, e.g. `root` |
| `DEPLOY_SSH_KEY` | Private deploy key (its public key in the server's `~/.ssh/authorized_keys`) |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan rumput.tech` (recommended) |

Variables (optional): `STAFF_WEB_PATH` (default `/var/www/bank-mini-frontend`),
`DEPLOY_PORT` (`22`).

Deploy:

```bash
git switch production
git merge main
git push origin production
```

Follow it under the repository's **Actions** tab.

## 2b. Manual: from your computer

Needs Node.js, `rsync` and SSH access to the server:

```bash
deploy/deploy.sh root@rumput.tech
```

| Variable | Default | Use |
| --- | --- | --- |
| `DEPLOY_PATH` | `/var/www/bank-mini-frontend` | Folder on the server |
| `DEPLOY_PORT` | `22` | SSH port |
| `SSH_KEY` | your SSH agent / `~/.ssh` | A specific private key file |
| `SKIP_BUILD=1` | off | Upload the existing `dist/` without building |

## Checks

| Symptom | Cause |
| --- | --- |
| `Permission denied (publickey)` | The key is not in the server's `authorized_keys`, or the wrong user |
| SSH times out | A firewall (ufw, Hostinger's panel, fail2ban) blocks port 22 |
| The page loads but every request fails | The API is not deployed, or nginx is missing the `/api` block |
| 404 when reloading a deep link | nginx is missing `try_files ... /index.html` |
| The camera does not start at the counter | The site is not on HTTPS |
