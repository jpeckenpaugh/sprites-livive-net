#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ARTIFACTS_DIR=${TEST_ARTIFACTS_DIR:-"$ROOT/test-artifacts"}
case "$ARTIFACTS_DIR" in
  /*) ;;
  *) ARTIFACTS_DIR="$ROOT/$ARTIFACTS_DIR" ;;
esac
mkdir -p "$ARTIFACTS_DIR"
docker build -t sprites-browser-test:local "$ROOT/test-runner"
docker run --rm --init --name sprites-browser-test \
  -e WORKSPACE_DIR="/game" \
  -e ARTIFACTS_DIR="/artifacts" \
  -v "$ROOT:/game:ro" -v "$ARTIFACTS_DIR:/artifacts" \
  sprites-browser-test:local
