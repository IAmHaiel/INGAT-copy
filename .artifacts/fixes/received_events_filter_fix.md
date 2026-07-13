# Fix: Received Transactions Tab Empty

## What Broke
The "Received" tab in the dashboard history was always empty, even when other users successfully deposited funds to the receiver's address.

## Root Cause
1. **Incorrect Wildcard Filter Syntax**: In `contract.ts`, the `fetchReceivedDepositEvents` function queried Soroban RPC event filters with `['*']` for the sender topic position to match any sender. However, the Soroban RPC requires a literal string `"*"` (not wrapped in an array) to act as a segment wildcard. Passing `['*']` resulted in the RPC searching for a literal asterisk value, matching nothing. (The "Sent" tab worked because it successfully fell back to local storage).
2. **Limited Event Retention**: The ledger lookback window was limited to 1 day (`LEDGERS_PER_DAY`), meaning older testnet deposits were missed by the RPC node.

## The Fix
1. Updated `topics` wildcards in `contract.ts` to `*` (using `as any` type casting to satisfy the TypeScript compiler's type constraints).
2. Expanded the lookback window to 7 days (`LEDGERS_PER_DAY * 7`).
3. Added local caching (`localStorage`) of received events in `useDashboardTransactions.ts` so they persist even if the testnet RPC event retention window expires.
