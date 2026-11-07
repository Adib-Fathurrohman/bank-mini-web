#!/usr/bin/env bash
# Build the staff web app and upload it to the VPS. Used by the GitHub workflow
# and by hand:
#
#   deploy/deploy.sh root@rumput.tech
#
# Options (environment variables):
#   DEPLOY_PATH   folder on the server            (default /var/www/bank-mini-frontend)
#   DEPLOY_PORT   SSH port                        (default 22)
#   SSH_KEY       private key file for SSH         (default: your SSH agent / ~/.ssh)
#   SKIP_BUILD=1  upload the existing dist/ without building
set -euo pipefail

TARGET="${1:-${DEPLOY_TARGET:-}}"
if [ -z "$TARGET" ]; then
  echo "Usage: deploy/deploy.sh user@host" >&2
  exit 1
fi

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/bank-mini-frontend}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
SSH=(ssh -p "$DEPLOY_PORT" -o BatchMode=yes)
if [ -n "${SSH_KEY:-}" ]; then
  SSH+=(-i "$SSH_KEY")
fi

cd "$(dirname "$0")/.."

if [ "${SKIP_BUILD:-}" != "1" ]; then
  echo "› Building"
  npm ci
  npm test
  # Same-origin API in production: nginx sends /api to Laravel.
  VITE_API_BASE_URL=/api npm run build
fi

if [ ! -f dist/index.html ]; then
  echo "dist/index.html is missing: build first (or unset SKIP_BUILD)." >&2
  exit 1
fi

# Two passes so pages already open keep working: first the new hashed files next
# to the old ones, then index.html, and only then remove what is no longer built.
echo "› Uploading to $TARGET:$DEPLOY_PATH"
rsync -rz --exclude=index.html --rsync-path="mkdir -p '$DEPLOY_PATH' && rsync" -e "${SSH[*]}" dist/ "$TARGET:$DEPLOY_PATH/"
rsync -rz --delete-after -e "${SSH[*]}" dist/ "$TARGET:$DEPLOY_PATH/"
"${SSH[@]}" "$TARGET" "chmod -R a+rX '$DEPLOY_PATH'"

echo "✓ Deployed. nginx serves the new files at once; nothing was restarted."
