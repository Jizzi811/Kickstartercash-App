#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-frontend/src}"
echo "BrandMind Design-System Audit"
echo "Root: $ROOT"
echo
for pattern in 'bg-\[#' 'text-\[#' 'border-\[#' '#[0-9A-Fa-f]{3,8}' '@keyframes' 'PageHeader' 'PageTitle' 'rounded-(sm|md|lg|xl|2xl|3xl)'; do
  count=$(rg -n "$pattern" "$ROOT" -g '!**/node_modules/**' | wc -l | tr -d ' ')
  printf '%-34s %s\n' "$pattern" "$count"
done
