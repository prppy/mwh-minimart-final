#!/bin/bash
# Adds one or more Gluestack UI components and updates ui-components.txt.
# Use this instead of running "npx gluestack-ui add <component>" directly.
# Usage: bash client/scripts/add-ui.sh <component> [<component2> ...]

set -e

if [ $# -eq 0 ]; then
  echo "Usage: bash client/scripts/add-ui.sh <component> [<component2> ...]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

npx gluestack-ui add "$@"

for comp in "$@"; do
  echo "$comp" >> "$SCRIPT_DIR/ui-components.txt"
done

sort -u "$SCRIPT_DIR/ui-components.txt" -o "$SCRIPT_DIR/ui-components.txt"

echo ""
echo "Updated scripts/ui-components.txt — commit it to save the change:"
echo "  git add client/scripts/ui-components.txt && git commit -m \"Add $* to Gluestack UI components\""
