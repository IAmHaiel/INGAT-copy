# Bug Fix: Freighter Network Passphrase Mismatch

- **Date:** 2026-07-13
- **File affected:** `apps/web/lib/stellar/freighter.ts`

### What Broke
When executing the remittance split transaction, the Freighter wallet displayed an error:
`The transaction you're trying to sign is on Test Stellar Network ; September 2015. Signing this transaction is not possible at the moment.`
The console logged `The user rejected this request.` at `signTxWithFreighter`.

### Root Cause
The `signTxWithFreighter` function hardcoded the network passphrase string as `'Test Stellar Network ; September 2015'`, which had a typo ("Stellar" instead of "SDF"). The correct Stellar Testnet network passphrase expected by the SDK and Freighter is `'Test SDF Network ; September 2015'`. This mismatch caused the Freighter extension to reject the transaction signing request because it was connected to the actual Testnet but received a signing payload for a non-existent network.

### The Fix
1. Imported the correct `NETWORK_PASSPHRASE` from `apps/web/lib/stellar/client.ts` (which utilizes the standard SDK constant `Networks.TESTNET` / `'Test SDF Network ; September 2015'`).
2. Updated `signTransaction` call to pass `NETWORK_PASSPHRASE` instead of the hardcoded string.
3. Added a pre-flight safety check in `signTxWithFreighter` that fetches the active Freighter network passphrase and throws a friendly error if it does not match `NETWORK_PASSPHRASE`.
