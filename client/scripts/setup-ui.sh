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

# Ensure Node >= 18 (gluestack-ui CLI requirement)
NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  if command -v nvm &> /dev/null; then
    echo "Node $NODE_MAJOR detected — switching to Node 20 via nvm..."
    source "$(nvm which 20 2>/dev/null | sed 's|/bin/node||')/../../nvm.sh" 2>/dev/null \
      || source ~/.nvm/nvm.sh
    nvm use 20
  else
    echo "Error: Node >= 18 is required. Current version: $(node --version)"
    echo "Install nvm (https://github.com/nvm-sh/nvm) or switch to Node 18+ manually."
    exit 1
  fi
fi

# On a fresh clone (dev machine or CI) gluestack is not initialised yet and
# "gluestack-ui add" refuses to run. --template-only writes the provider
# into components/ui without touching package.json.
FRESH_INIT=0
if [ ! -d components/ui/gluestack-ui-provider ]; then
  echo "Initialising gluestack-ui..."
  if [ -f .npmrc ]; then cp .npmrc .npmrc.pre-init; fi
  npx gluestack-ui init -y --nativewind --template-only
  FRESH_INIT=1
fi

echo "Adding Gluestack UI components..."
xargs npx gluestack-ui add < "$SCRIPT_DIR/ui-components.txt"

if [ "$FRESH_INIT" = "1" ]; then
  # init scaffolds starter files this project doesn't use. postcss.config.js
  # actively breaks the build (it loads autoprefixer, which isn't a
  # dependency); tailwind already runs through nativewind + tailwind.config.js.
  rm -f postcss.config.js globals.css gluestack-ui.config.json
  if [ -f .npmrc.pre-init ]; then mv .npmrc.pre-init .npmrc; fi
fi

echo "Done. Gluestack UI components are in client/components/ui/"
