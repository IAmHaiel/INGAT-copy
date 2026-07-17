# Vercel Deployment Plan — Zero Code Changes

**Goal**: Deploy the current codebase to Vercel without modifying any source code.

---

## Current State

| Item | Status |
|------|--------|
| TypeScript fixes are on branch `main` of `IAmHaiel/INGAT-copy` (commit `91ead0a`) | ✅ |
| Vercel project `ingat-web-git-main-haiel` is connected to **old fork** `IAmHaiel/INGAT` | ❌ |
| `INGAT-copy` is the repo with the TypeScript fix + production deploy job | ✅ |

The build failure (`TypeError: Bad union switch 4`) was fixed in commit `7d106d7` (SDK v16), and the subsequent TypeScript errors (`wallet_address not in never[]`) were fixed in commit `91ead0a`. Both are only on `IAmHaiel/INGAT-copy`, not on the old fork that Vercel is tracking.

---

## Steps

### Step 1 — Point Vercel to the correct repo

The Vercel project is currently watching the fork `IAmHaiel/INGAT` (old). It needs to watch `IAmHaiel/INGAT-copy` (new, with fixes).

Go to **Vercel Dashboard → Project `ingat` → Settings → Git**:

1. Click **Disconnect Git Repository**
2. Click **Connect Git Repository**
3. Select `IAmHaiel/INGAT-copy`
4. In **Root Directory**, confirm it says `apps/web`

Vercel will auto-detect the latest commit on `main` and trigger a new build — this time with the TypeScript fix included.

---

### Step 2 — Set environment variables in Vercel Dashboard

The app needs these env vars to build and run. Set them in **Vercel Dashboard → Project → Settings → Environment Variables**. Add scopes: **Production** + **Preview** + **Development**.

| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_CONTRACT_ID` | `CBI7CWIQOV2T63LB3XMWQJL52IMJGPO6LMSU2XMZHG2SD3JKH47VD42Z` | From contract deploy |
| `NEXT_PUBLIC_TOKEN_ID` | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | From contract deploy |
| `NEXT_PUBLIC_RPC_URL` | `https://soroban-testnet.stellar.org` | Testnet |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` | Testnet |

**Supabase env vars** (optional — the app gracefully degrades without them):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | *(your Supabase project URL)* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(your Supabase anon key)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your Supabase service role key)* |
| `SUPABASE_JWT_SECRET` | *(your Supabase JWT secret)* |
| `GROQ_API_KEY` | *(your Groq API key)* |

---

### Step 3 — Verify deployment

After Step 1, Vercel will auto-deploy. Check:

1. **Build log** — go to Vercel Dashboard → Deployments → latest deployment → inspect build log
2. **Live URL** — visit `https://ingat-web-git-main-haiel.vercel.app`
3. **Connect Freighter** — the app should load and connect
4. **Receiver buckets** — switch to receiver role, balances should load from testnet

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Build still fails with `wallet_address` | Vercel still watching old fork | Re-check Git connection in Step 1 |
| Build fails with `Bad union switch` | SDK still outdated | Push SDK update or confirm commit `7d106d7` is latest |
| App loads but history is empty | Supabase not configured | Expected — no code changes needed. Core on-chain ops still work. |
| "Cannot find module" error | Missing dependencies | Run `npm install` and push updated `package-lock.json` |

---

## What We're NOT Doing

- ❌ Removing Supabase from the codebase
- ❌ Rewriting hooks to use on-chain events
- ❌ Changing any source files
- ❌ Modifying package.json, next.config, or tsconfig

The codebase stays exactly as it is. This plan only changes Vercel's configuration to point at the correct repository that already has the fixes.
