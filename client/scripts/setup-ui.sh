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

# On a fresh clone (dev machine or CI) gluestack is not initialised yet and
# "gluestack-ui add" refuses to run. --template-only writes the provider
# into components/ui without touching package.json or the config files.
if [ ! -d components/ui/gluestack-ui-provider ]; then
  echo "Initialising gluestack-ui..."
  npx gluestack-ui init -y --nativewind --template-only
fi

echo "Adding Gluestack UI components..."
xargs npx gluestack-ui add < "$SCRIPT_DIR/ui-components.txt"
echo "Done. Gluestack UI components are in client/components/ui/"
