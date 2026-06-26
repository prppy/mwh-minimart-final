#!/bin/bash
# Regenerates Gluestack UI components into client/components/ui/.
# Run this after cloning or when components are missing.
# Usage: bash client/scripts/setup-ui.sh
#
# To add a new component and keep the list in sync, use:
#   bash client/scripts/add-ui.sh <component>

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "Adding Gluestack UI components..."
xargs npx gluestack-ui add < "$SCRIPT_DIR/ui-components.txt"
echo "Done. Gluestack UI components are in client/components/ui/"
