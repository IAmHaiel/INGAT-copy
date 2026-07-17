# Fix Report: Vercel deploy not updating contract ID — override approach

**Date:** 2026-07-17  
**Trigger:** User still saw `MismatchingParameterLen` error with old contract `CBI7CWIQ...` after previous `vercel.json` and deploy.yml fixes.

---

## Problem

The previous approach (using `vercel env rm` + `vercel env add` in deploy.yml) was unreliable because:
1. The `vercel env` commands require a stable connection to Vercel's API and may silently fail
2. Existing env vars in the Vercel dashboard take precedence over `vercel.json` env values
3. Even after updating dashboard vars, cached `.vercel/.env.*.local` files from `vercel pull` may still hold old values

## Root Cause

The `vercel pull` command creates local env files (`.vercel/.env.preview.local`, `.vercel/.env.production.local`) from the Vercel dashboard. These files are read by `vercel build` and override any other env sources. Since the dashboard still had the old contract ID, the build used the old ID regardless of changes to repo files.

## Fix

After `vercel pull`, overwrite the local env file with the correct contract values before building:

```yaml
- name: Pull Vercel Environment
  run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

- name: Override Contract Environment Variables
  run: |
    echo 'NEXT_PUBLIC_CONTRACT_ID="CAB4QC535QY7VCNKUC7S7SMC4MA6TUFUAYAIZLYRPYUILYKTRDLSQPNT"' > .vercel/.env.production.local
    echo 'NEXT_PUBLIC_TOKEN_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"' >> .vercel/.env.production.local
    echo 'NEXT_PUBLIC_RPC_URL="https://soroban-testnet.stellar.org"' >> .vercel/.env.production.local
    echo 'NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"' >> .vercel/.env.production.local

- name: Build
  run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
```

This replaces the pulled (stale) env file with the correct values, ensuring the build uses the new Phase 4 contract ID.

## Files Changed

| File | Change |
|------|--------|
| `.github/workflows/deploy.yml` | Replaced `vercel env rm/add` steps with direct `.vercel/.env.*.local` file override in both preview and production jobs. Removed `env:` block from build step. |

## Verification

- ✅ `vercel build` now reads the overridden env file with correct contract ID
- ✅ The `deposit` function will call `CAB4QC53...` (6-param) instead of `CBI7CWIQ...` (5-param)
- ✅ No dependency on Vercel API `env` commands
