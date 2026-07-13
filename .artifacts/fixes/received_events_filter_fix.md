# Fix: Received Transactions Tab Empty & Console Errors

## What Broke
The "Received" tab in the dashboard history was empty, and the console was throwing `Error fetching received deposit events: {}`.

## Root Cause
1. **Ledger Range Bounds Error**: The lookback window was set to exactly 7 days (`LEDGERS_PER_DAY * 7`). The testnet RPC node retains exactly 7 days of history (120,960 ledgers). Because `latestLedger` advances continuously, querying `latestLedger - (17280 * 7)` sometimes results in a ledger sequence that is 1 or 2 ledgers older than the node's `oldestLedger`. This caused the RPC to immediately reject the request with HTTP 400 (`-32600: startLedger must be within the ledger range`), which surfaced as an empty error object in the frontend console.
2. **Wildcard Format Requirements**: We discovered that the Soroban RPC backend strictly requires wildcard topics to be an array `['*']` (which serializes as `["*"]`). Providing a raw string `"*"` causes a JSON unmarshalling panic.

## The Fix
1. Reduced the lookback window to 6 days (`LEDGERS_PER_DAY * 6`). This gives a 1-day safety buffer inside the RPC's retention window, completely preventing the "startLedger out of bounds" error.
2. Maintained `['*']` as the valid wildcard format to prevent RPC JSON unmarshalling errors.
3. Kept local caching (`localStorage`) of received events in `useDashboardTransactions.ts` so historical events persist on the client side permanently, regardless of the testnet retention limits.
