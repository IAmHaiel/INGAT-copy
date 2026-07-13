# Fix: Received Transactions Tab Empty

## What Broke
The "Received" tab in the dashboard history was always empty, even when other users successfully deposited funds to the receiver's address.

## Root Cause
1. **Limited Event Retention (Lookback Window)**: The ledger lookback window was limited to 1 day (`LEDGERS_PER_DAY`). Since testnet transactions are often hours or days old and the RPC node only retains a limited history, the events were outside the 1-day window, resulting in an empty response from the RPC.
2. **Wildcard Array Format Requirement**: The `@stellar/stellar-sdk` and Soroban RPC Go backend require the wildcard to be wrapped in an array `['*']` (which serializes as `["*"]`). Attempting to use a raw string `"*"` causes the RPC unmarshaller to fail with `cannot unmarshal string into Go struct field EventFilter.filters.topics of type protocol.TopicFilter`.

## The Fix
1. Maintained `['*']` as the wildcard format to prevent RPC parsing errors.
2. Expanded the lookback window to 7 days (`LEDGERS_PER_DAY * 7`).
3. Added local caching (`localStorage`) of received events in `useDashboardTransactions.ts` so they persist even if the testnet RPC event retention window expires.
