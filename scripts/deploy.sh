#!/usr/bin/env bash
# ==============================================================================
# INGAT — Deploy Script
# Deploys the PHPC stablecoin SAC and INGAT vault contract to Stellar Testnet.
#
# Usage:
#   npm run contract:deploy
#   # or directly:
#   bash scripts/deploy.sh
#
# Prerequisites:
#   - Rust toolchain with wasm32-unknown-unknown target
#   - Stellar CLI (stellar) installed
#
# What this script does:
#   1. Checks prerequisites (stellar CLI, wasm target)
#   2. Builds the optimized contract WASM
#   3. Generates a deployer identity (if not exists) and funds via Friendbot
#   4. Deploys the PHPC stablecoin SAC
#   5. Deploys the INGAT vault contract
#   6. Initializes the vault with the PHPC token address
#   7. Outputs environment variables for .env.local
#
# After running, copy the output into apps/web/.env.local
# ==============================================================================

set -euo pipefail

NETWORK="testnet"
IDENTITY="deployer"
ASSET_CODE="PHPC"
CONTRACT_DIR="contracts/ingat-vault"
WASM_PATH="$CONTRACT_DIR/target/wasm32v1-none/release/ingat_vault.wasm"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ==============================================================================
# Step 1: Check prerequisites
# ==============================================================================
info "Checking prerequisites..."

if ! command -v stellar &> /dev/null; then
    error "stellar CLI not found. Install with: cargo install --locked stellar-cli --features opt"
fi

if ! command -v cargo &> /dev/null; then
    error "cargo not found. Install Rust from https://rustup.rs/"
fi

if ! rustup target list --installed | grep -q "wasm32"; then
    warn "wasm32 target not found. Installing..."
    rustup target add wasm32-unknown-unknown
fi

success "Prerequisites OK (stellar $(stellar --version | head -1 | awk '{print $2}'))"

# ==============================================================================
# Step 2: Build the contract
# ==============================================================================
info "Building contract WASM..."

stellar contract build --manifest-path "$CONTRACT_DIR/Cargo.toml" 2>&1 | tail -3

if [ ! -f "$WASM_PATH" ]; then
    error "WASM not found at $WASM_PATH after build"
fi

success "Contract built: $(wc -c < "$WASM_PATH") bytes"

# ==============================================================================
# Step 3: Generate deployer identity (if needed)
# ==============================================================================
info "Checking deployer identity..."

if stellar keys address "$IDENTITY" &> /dev/null; then
    DEPLOYER_ADDRESS=$(stellar keys address "$IDENTITY")
    success "Deployer exists: $DEPLOYER_ADDRESS"
else
    info "Generating new deployer identity..."
    stellar keys generate "$IDENTITY" --network "$NETWORK"
    DEPLOYER_ADDRESS=$(stellar keys address "$IDENTITY")
    success "Deployer created and funded: $DEPLOYER_ADDRESS"
fi

# Verify the account is funded
if ! curl -sf "https://horizon-testnet.stellar.org/accounts/$DEPLOYER_ADDRESS" > /dev/null 2>&1; then
    info "Funding deployer via Friendbot..."
    curl -s "https://friendbot.stellar.org/?addr=$DEPLOYER_ADDRESS" > /dev/null
    success "Deployer funded via Friendbot"
fi

# ==============================================================================
# Step 4: Deploy PHPC Stablecoin SAC
# ==============================================================================
info "Deploying $ASSET_CODE Stablecoin SAC..."

PHPC_OUTPUT=$(stellar contract asset deploy \
    --asset "$ASSET_CODE:$DEPLOYER_ADDRESS" \
    --network "$NETWORK" \
    --source "$IDENTITY" 2>&1)

# Extract the contract ID (last line that starts with C)
PHPC_SAC_ID=$(echo "$PHPC_OUTPUT" | grep -oP '^C[A-Z0-9]{55}$' | tail -1)

if [ -z "$PHPC_SAC_ID" ]; then
    # Maybe already deployed — try to get it from the output
    PHPC_SAC_ID=$(echo "$PHPC_OUTPUT" | grep -oP 'C[A-Z0-9]{55}' | tail -1)
fi

if [ -z "$PHPC_SAC_ID" ]; then
    error "Failed to deploy PHPC SAC. Output:\n$PHPC_OUTPUT"
fi

success "PHPC SAC deployed: $PHPC_SAC_ID"

# ==============================================================================
# Step 5: Deploy INGAT Vault Contract
# ==============================================================================
info "Deploying INGAT Vault contract..."

VAULT_OUTPUT=$(stellar contract deploy \
    --wasm "$WASM_PATH" \
    --network "$NETWORK" \
    --source "$IDENTITY" 2>&1)

VAULT_ID=$(echo "$VAULT_OUTPUT" | grep -oP '^C[A-Z0-9]{55}$' | tail -1)

if [ -z "$VAULT_ID" ]; then
    VAULT_ID=$(echo "$VAULT_OUTPUT" | grep -oP 'C[A-Z0-9]{55}' | tail -1)
fi

if [ -z "$VAULT_ID" ]; then
    error "Failed to deploy vault. Output:\n$VAULT_OUTPUT"
fi

success "Vault deployed: $VAULT_ID"

# ==============================================================================
# Step 6: Initialize Vault with PHPC token
# ==============================================================================
info "Initializing vault with PHPC token..."

INIT_OUTPUT=$(stellar contract invoke \
    --id "$VAULT_ID" \
    --network "$NETWORK" \
    --source "$IDENTITY" \
    -- initialize --token "$PHPC_SAC_ID" 2>&1)

# Verify initialization
VERIFY_TOKEN=$(stellar contract invoke \
    --id "$VAULT_ID" \
    --network "$NETWORK" \
    --source "$IDENTITY" \
    -- get_token 2>&1 | grep -oP '"C[A-Z0-9]{55}"' | tr -d '"')

if [ "$VERIFY_TOKEN" != "$PHPC_SAC_ID" ]; then
    warn "Token verification mismatch. Expected: $PHPC_SAC_ID, Got: $VERIFY_TOKEN"
else
    success "Vault initialized with PHPC token"
fi

# ==============================================================================
# Output — copy to apps/web/.env.local
# ==============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Vault Contract:     $VAULT_ID"
echo "PHPC SAC:           $PHPC_SAC_ID"
echo "Deployer:           $DEPLOYER_ADDRESS"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Copy the following into apps/web/.env.local:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "NEXT_PUBLIC_CONTRACT_ID=$VAULT_ID"
echo "NEXT_PUBLIC_STABLECOIN_TOKEN_ID=$PHPC_SAC_ID"
echo "NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org"
echo "NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015"
echo ""
