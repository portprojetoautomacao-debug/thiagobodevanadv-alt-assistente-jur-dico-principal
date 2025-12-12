#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Merging LCOV files..."

LCOV_ROOT=coverage/lcov.info
LCOV_API=coverage-api/lcov.info
LCOV_EXT=chrome-extension-pje/coverage/lcov.info

mkdir -p coverage

if [[ ! -f "$LCOV_API" && ! -f "$LCOV_EXT" ]]; then
  echo "❌ No LCOV files found. Expected $LCOV_API and/or $LCOV_EXT"
  exit 1
fi

echo "Generating merged LCOV: $LCOV_ROOT"
rm -f "$LCOV_ROOT"

declare -a FILES_TO_MERGE=()
if [[ -f "$LCOV_API" ]]; then FILES_TO_MERGE+=("$LCOV_API"); fi
if [[ -f "$LCOV_EXT" ]]; then FILES_TO_MERGE+=("$LCOV_EXT"); fi

# Basic LCOV concatenation with deduplication of 'TN:' and 'end_of_record' lines.
for f in "${FILES_TO_MERGE[@]}"; do
  awk 'BEGIN {ORS="\n"} {if ($0 ~ /^TN:/) next; if ($0 ~ /^end_of_record/) next; print $0}' "$f" >> "$LCOV_ROOT"
  echo "end_of_record" >> "$LCOV_ROOT"
done

echo "✅ Merged LCOV created: $(du -h "$LCOV_ROOT" | cut -f1)"
exit 0
