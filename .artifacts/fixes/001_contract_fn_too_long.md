# Fix: Contract Function Name Too Long

- **What Broke:** Compilation failed during `npm run contract:build` with `error: contract function name is too long: 36, max is 32`.
- **Root Cause:** Soroban restricts exported contract function names to a maximum of 32 characters. `cancel_emergency_withdrawal_receiver` exceeded this with 36 characters.
- **The Fix:** Renamed the contract function and all references in the Rust contract, tests, and frontend Stellar client wrappers to `cancel_emergency_receiver` (25 characters).
