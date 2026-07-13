# Bug Fix: Empty Dashboard Allocation History

- **Date:** 2026-07-13
- **Files affected:**
  - `apps/web/lib/stellar/contract.ts`
  - `apps/web/hooks/useDeposit.ts`
  - `apps/web/hooks/useAllocationHistory.ts`

### What Broke
The transaction history list on the Sender Dashboard was always empty and did not show any records of sent transactions.

### Root Cause
1. In `contract.ts`, the `getEvents` query had an incorrectly structured `topics` array `[[depositSymbolXdr, senderScValXdr, '*']]`. Since the contract emits events with exactly three topic segments `(symbol, sender, receiver)`, the query looked for events with exactly one segment matching any of the three, resulting in zero results returned from the RPC.
2. The `localStorage` backup/optimistic UI write was removed from `useDeposit.ts` and `useAllocationHistory.ts` relied entirely on on-chain events, meaning that any new transaction wouldn't show up immediately or if the RPC had lag/purged older data.

### The Fix
1. Restructured `topics` in `contract.ts` to be a proper three-segment array: `[[depositSymbolXdr], [senderScValXdr], ['*']]`.
2. Restored optimistic caching inside `useDeposit.ts` by writing successful transaction details into `localStorage`.
3. Refactored `useAllocationHistory.ts` to retrieve and merge `localStorage` allocations with on-chain events, deduplicating them by transaction ID. This guarantees immediate updates and acts as a robust fallback.
