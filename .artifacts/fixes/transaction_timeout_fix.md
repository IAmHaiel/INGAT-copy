# Bug Fix: Transaction Polling Premature Timeout

- **Date:** 2026-07-13
- **File affected:** `apps/web/lib/stellar/contract.ts`

### What Broke
Transactions submitted to the network occasionally threw a `Transaction submission timeout or failure` error, even when the transaction was successfully processed by the Stellar network.

### Root Cause
The `submitTransaction` function polled `server.getTransaction(hash)` waiting for a status of `'PENDING'`. However, when a transaction is pending ledger inclusion in Soroban RPC, `getTransaction` returns `'NOT_FOUND'`. This caused the loop to exit on the very first poll cycle and throw a timeout/failure error.

### The Fix
Updated `submitTransaction`'s polling loop to poll while `txStatus.status` is `'NOT_FOUND'`, up to a maximum of 30 retries (30 seconds). It then handles `'SUCCESS'` and `'FAILED'` states correctly.
