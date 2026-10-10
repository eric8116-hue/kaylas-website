#!/usr/bin/env bash
# Stage the CURRENT working tree's public assets; never deploy or read Git HEAD.
# Server Functions and lib/ stay in the project root for Wrangler to compile.
# Usage: bash tools/build-clean-bundle.sh [empty-output-folder] (default: dist)
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/build-clean-bundle.py "${1:-dist}"
