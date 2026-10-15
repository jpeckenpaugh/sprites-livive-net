#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-8000}"
printf 'Serving Sprites at http://127.0.0.1:%s\n' "$PORT"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
