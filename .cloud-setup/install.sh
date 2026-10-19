#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --no-audit --no-fund --cache /workspace/.npm
npm exec vite -- --version
