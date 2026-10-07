#!/usr/bin/env bash
# Builds the folder that gets uploaded to Cloudflare Pages: only the public
# site files from the last commit. Leaves out notes (*.md), tests, the chat
# server (worker/), tools/, partials/, local caches and config.
# Usage: tools/build-clean-bundle.sh <empty-output-folder>
set -euo pipefail
out="${1:?give an output folder}"
cd "$(dirname "$0")/.."
mkdir -p "$out"
[ -z "$(ls -A "$out")" ] || { echo "output folder must be empty"; exit 1; }
git ls-files | grep -vE '^(\.gitignore|\.wrangler/|CRM-UPDATES/|tests/|worker/|tools/|partials/|wrangler\.toml$|[^/]+\.md$)' > "$out/.list"
git archive HEAD $(cat "$out/.list") | tar -x -C "$out"
rm "$out/.list"
if find "$out" -name '*.md' -o -path '*/tests/*' -o -path '*/worker/*' | grep -q .; then echo "notes or code leaked into bundle"; exit 1; fi
echo "$(find "$out" -type f | wc -l) files ready in $out"
