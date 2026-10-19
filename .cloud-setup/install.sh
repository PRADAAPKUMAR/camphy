#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# The checked-in npm lockfile is out of sync; preserve both repository lockfiles.
npm install --package-lock=false --no-audit --no-fund --cache /workspace/.npm
# Use the compiler version recorded in package-lock.json. Newer SWC native
# materialization rejects filesystem ownership in this cloud environment.
npm install --no-save --package-lock=false --no-audit --no-fund --cache /workspace/.npm @swc/core@1.13.2
node -e "require('@swc/core')"
