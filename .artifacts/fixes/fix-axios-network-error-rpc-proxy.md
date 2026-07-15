# Fix: AxiosError NetworkError in Browser RPC Calls

## What Broke
All Soroban RPC calls (simulateTransaction, getHealth, etc.) from the browser
failed with `AxiosError: NetworkError when attempting to fetch resource` in the
dev console. Error originated from `feaxios` `handleFetch()` function.

## Root Cause
The `@stellar/stellar-sdk` v13+ uses `feaxios` (a fetch-based axios clone) for
HTTP calls. Under Next.js 16 + Turbopack dev server, the cross-origin fetch from
the browser to `https://soroban-testnet.stellar.org` fails with Firefox's generic
"NetworkError when attempting to fetch resource" TypeError. The RPC endpoint
itself is healthy and CORS-enabled — the failure is in the browser's fetch
execution path when bundled through Turbopack's module system.

## The Fix
1. Created `/api/rpc` proxy route (`app/api/rpc/route.ts`) that forwards
   JSON-RPC POST bodies to the Soroban RPC server-side.
2. Changed `lib/stellar/client.ts` to use a lazy `getServer()` function that
   returns an `rpc.Server` pointing to `${window.location.origin}/api/rpc`
   in the browser, or the direct RPC URL server-side.
3. Updated all 4 consumer files (shared.ts, queries.ts, events.ts, submit.ts)
   to call `getServer()` instead of importing a module-level `server` constant.

This ensures all Stellar RPC traffic from the browser goes through the same
origin (localhost), eliminating the cross-origin fetch issue entirely.
