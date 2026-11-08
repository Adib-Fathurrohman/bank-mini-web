#!/usr/bin/env bash
# Points the staff web app's `current` back at an existing release. Run as root.
# Usage: rollback-staff.sh 0.1.0
set -euo pipefail
V="${1:?usage: $0 <version>}"; V="${V#v}"
STAFF=/var/www/rumput/bank-mini/staff
[ -d "$STAFF/releases/v$V" ] || { echo "No release v$V in $STAFF/releases:" >&2; ls "$STAFF/releases" >&2; exit 1; }
ln -sfn "releases/v$V" "$STAFF/current.new" && mv -Tf "$STAFF/current.new" "$STAFF/current"
echo "Active release: $(readlink "$STAFF/current")"
