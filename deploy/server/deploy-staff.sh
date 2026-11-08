#!/usr/bin/env bash
# Deploys a GitHub release of the Rumput Bank Mini staff web app. Run as root.
# Usage: deploy-staff.sh 0.1.0 [expected-sha256]
# Downloads the release, verifies its SHA-256 (against the published .sha256 and,
# if given, the value recorded when it was built), extracts it into a new release
# folder (never overwriting one), checks it and only then switches `current`.
# Nothing is restarted: nginx serves the files straight from `current`.
set -euo pipefail

V="${1:?usage: $0 <version, e.g. 0.1.0> [expected-sha256]}"; V="${V#v}"
EXPECTED="${2:-}"
APP=/var/www/rumput/bank-mini; STAFF=$APP/staff; REL=$STAFF/releases/v$V
NAME=rumput-bank-mini-staff-v$V
URL=https://github.com/Adib-Fathurrohman/bank-mini-web/releases/download/v$V

[ ! -e "$REL" ] || { echo "Release v$V already exists: $REL" >&2; exit 1; }

DL=$APP/tmp/staff-download-v$V
rm -rf -- "$DL"
install -d -o rumput -g rumput -m 700 "$DL"
curl -fsSL -o "$DL/$NAME.tar.gz" "$URL/$NAME.tar.gz"
curl -fsSL -o "$DL/$NAME.tar.gz.sha256" "$URL/$NAME.tar.gz.sha256"
(cd "$DL" && sha256sum -c "$NAME.tar.gz.sha256")
if [ -n "$EXPECTED" ]; then
  actual=$(sha256sum "$DL/$NAME.tar.gz" | cut -d' ' -f1)
  [ "$actual" = "$EXPECTED" ] || { echo "SHA-256 $actual does not match the recorded $EXPECTED" >&2; exit 1; }
  echo "Matches the recorded SHA-256."
fi

install -d -o rumput -g rumput -m 755 "$STAFF" "$STAFF/releases"

created=0
cleanup() { [ "$created" = 1 ] && rm -rf -- "$REL"; }
trap 'echo "FAILED: removing the incomplete release; the active release is unchanged." >&2; cleanup' ERR

install -d -o rumput -g rumput -m 755 "$REL"; created=1
tar -xzf "$DL/$NAME.tar.gz" -C "$REL" --no-same-owner --no-same-permissions
chown -R rumput:rumput "$REL"
find "$REL" -type d -exec chmod 755 {} +; find "$REL" -type f -exec chmod 644 {} +

# A static build only: refuse anything that looks like configuration or source.
[ -f "$REL/index.html" ] && [ -d "$REL/assets" ] || { echo "index.html or assets/ missing" >&2; false; }
bad=$(find "$REL" \( -name '.*' -o -name '*.map' -o -name '*.php' -o -name '*.ts' -o -name '*.tsx' -o -name 'package.json' \) -print -quit)
[ -z "$bad" ] || { echo "Unexpected file in the release: $bad" >&2; false; }
grep -rqs 'https://api-bank.rumput.tech/api' "$REL/assets" || { echo "The build does not point at https://api-bank.rumput.tech/api" >&2; false; }

trap - ERR
ln -sfn "releases/v$V" "$STAFF/current.new" && mv -Tf "$STAFF/current.new" "$STAFF/current"
rm -rf -- "$DL"
echo "Active release: $(readlink "$STAFF/current")"
echo "Old releases are kept in $STAFF/releases (rollback: $APP/bin/rollback-staff.sh <version>)."
