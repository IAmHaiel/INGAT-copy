# Fix Report: Vercel build failed — `vercel.json` schema validation

**Date:** 2026-07-17  
**Trigger:** Vercel deployment failed after pushing `vercel.json` with invalid property.

---

## Error

```
Build Failed
The `vercel.json` schema validation failed with the following message:
should NOT have additional property `rootDirectory`
```

## Root Cause

`vercel.json` had three properties that are not part of the Vercel JSON schema:

| Invalid Property | Correct Approach |
|-----------------|------------------|
| `rootDirectory` | Set in Vercel dashboard → Project Settings → Root Directory. Not a `vercel.json` field. |
| `buildCommand` | Auto-detected by Vercel for Next.js. Not needed in `vercel.json`. |
| `outputDirectory` | Auto-detected by Vercel for Next.js (`.next`). Not needed. |

The file was originally written with these fields because the [CI/CD docs](../ci-cd-setup.md) mentioned they could be set in the Vercel dashboard, but mistakenly included them in `vercel.json` instead.

## Fix

Simplified `vercel.json` to only contain the `env` block:

```json
{
  "env": {
    "NEXT_PUBLIC_CONTRACT_ID": "CAB4QC535QY7VCNKUC7S7SMC4MA6TUFUAYAIZLYRPYUILYKTRDLSQPNT",
    "NEXT_PUBLIC_TOKEN_ID": "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    "NEXT_PUBLIC_RPC_URL": "https://soroban-testnet.stellar.org",
    "NEXT_PUBLIC_NETWORK_PASSPHRASE": "Test SDF Network ; September 2015"
  }
}
```

Vercel auto-detects `framework: "nextjs"`, `buildCommand: "npm run build"`, `outputDirectory: ".next"`, and `installCommand: "npm install"` from the project settings.

## Verification

- ✅ Vercel deployment now builds and deploys successfully
- ✅ `vercel.json` passes Vercel's schema validation
