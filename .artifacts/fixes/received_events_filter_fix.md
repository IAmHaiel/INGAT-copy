# Fix: Received Transactions Tab Empty & Console Errors

## What Broke
The "Received" tab in the dashboard history was empty, and the console was throwing `Error fetching received deposit events: {}`.

## Root Cause
1. **Ledger Range Bounds Error**: The lookback window was set to exactly 7 days (`LEDGERS_PER_DAY * 7`), matching the RPC retention limit. Because `latestLedger` advances continuously, querying exactly 7 days occasionally requested a ledger sequence that was 1 or 2 ledgers older than the node's `oldestLedger`. This caused the RPC to reject the request (`-32600`).
2. **Wildcard Array Matching Issue**: While `['*']` was accepted by the RPC's JSON unmarshaller, the Soroban RPC treats `['*']` as an exact string match for a string `*`, NOT as a wildcard! This meant the query was looking for an event where the sender was exactly the string `*`, resulting in 0 events.

## The Fix
1. Reduced the lookback window to 6 days (`LEDGERS_PER_DAY * 6`) to provide a safety buffer inside the RPC's retention window, preventing the "startLedger out of bounds" error.
2. Removed explicit middle wildcards entirely. We now rely on Soroban's implicit trailing wildcards by omitting trailing `topics` array elements.
   - For `fetchDepositEvents`: We pass `[depositSymbolXdr, senderScValXdr]`, implicitly matching any receiver.
   - For `fetchReceivedDepositEvents`: We pass `[depositSymbolXdr]`, fetching ALL deposits, and then manually filter by receiver in JavaScript.
3. Increased the limit to `1000` to accommodate manual filtering.
4. Kept local caching (`localStorage`) of received events in `useDashboardTransactions.ts` so historical events persist on the client side permanently.
