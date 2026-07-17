# Phase 4 — Post-Implementation Fixes & UX Polish

**Date:** 2026-07-17  
**Commits:** `9f45fc2..0d42153` (7 commits since the implementation report)  
**Contract:** v2.1.0 — `CDNCRZ3GQTDUD2VIPTRGNM7SZLML27LW3LAYISECDVDEFTTGURSLS7XC`

---

## Fix 1: Sender Reclaim Without Release Approval

**Commit:** `9f45fc2`  
**Issue:** Sender could not reclaim goal funds after `unlock_date` on TimeAndApproval buckets — error #18 (`ReleaseNotApproved`). The `withdraw_goal_sender` function was incorrectly calling `release::can_withdraw_goal()`, which required the release to be approved even for the sender.

**Contract change (`withdraw.rs`):**
- Removed `release::can_withdraw_goal()` check from `withdraw_goal_sender`
- Restored original `unlock_date`-only check for sender
- The approval requirement now only applies to the **receiver's** `withdraw_goal`

**Result:** Sender can reclaim after `unlock_date` regardless of approval mode.

### New Contract Deployment

Since the contract WASM changed, a fresh deployment was required:

| Property | Value |
|----------|-------|
| Contract ID | `CDNCRZ3GQTDUD2VIPTRGNM7SZLML27LW3LAYISECDVDEFTTGURSLS7XC` |
| WASM Hash | `211fa89cd712ad090ce8507c37c3657266e03d108078809f5511c53f6133b629` |
| Exported Functions | 16 (same set) |

All relevant files updated: `client.ts`, `constants.ts`, `.env.example`, `README.md`, `vercel.json`, `deploy.yml`, `docs/deployments.md`, `docs/testing-guide.md`.

---

## Fix 2: Hide Release UI When Goal Already Reclaimed

**Commit:** `f31abf9`  
**Issue:** After the sender reclaimed the goal (balance = 0), the sender still saw the amber "Approve Release" banner, and the receiver still saw the "Release requested — awaiting sender approval" message. Both were misleading since there was nothing left to approve or withdraw.

**Changes:**

| File | Change |
|------|--------|
| `SenderBucketCard.tsx` | Added `hasGoalBalance &&` before rendering the "Approve Release" banner |
| `GoalBucketCard.tsx` | Added `hasBalance &&` before rendering the pending status message and Request Release button |

---

## Fix 3: Remove Hardcoded `effectiveApprovalRequired = true`

**Commit:** `16bf182`  
**Issue:** `effectiveApprovalRequired` was hardcoded to `true`, causing TimeOnly buckets (deposits without sender approval) to show "Request Release" after unlock, instead of "Withdraw Unlocked Savings". Clicking it produced error #15 (`BucketNotTimeAndApproval`).

**Root cause:** The prop pipeline bug causes `approvalRequired` (from container) to arrive as `false` in the component. The hardcode was a workaround that broke TimeOnly buckets.

**Fix:** Added a `useEffect` that calls `fetchBucketBalances` directly from the component on mount, finds the current bucket by ID, and reads `approvalRequired` from the contract response. The effective value becomes:

```ts
const effectiveApprovalRequired = localApprovalRequired || approvalRequired;
```

Where `localApprovalRequired` is fetched directly from the contract (always correct), and `approvalRequired` is the potentially-broken prop (fallback).

**Result after contract fetch completes:**

| Bucket type | `localApprovalRequired` | `effectiveApprovalRequired` | Correct? |
|-------------|------------------------|----------------------------|----------|
| TimeAndApproval | `true` | `true` | ✅ |
| TimeOnly | `false` | `false` | ✅ |

---

## Fix 4: Visual Distinction for Approved Release Withdraw

**Commit:** `5b014fd`  
**Issue:** Both the normal timelock expiry and the approved release flow showed the same green "Withdraw Unlocked Savings" button — confusing for the user.

**Fix:** The approved release withdraw now has **blue styling** with an info badge:

| Scenario | Button text | Color | Badge |
|----------|-------------|-------|-------|
| Normal unlock (TimeOnly) | "Withdraw Unlocked Savings" | Green | None |
| Approved release | "Withdraw Approved Release" | Blue | "Sender approved release — goal is unlocked" |

---

## Fix 5: Hide Withdraw Buttons When Balance is 0

**Commit:** `49bf91c`  
**Issue:** After a full withdrawal, the button remained visible (disabled) — confusing because it suggested the action was still available.

**Fix:** Added `hasBalance &&` to the rendering condition of both withdraw buttons. When `balance` reaches 0, the buttons disappear entirely.

---

## Fix 6: Bucket List Order

**Commit:** `0d42153`  
**Issue:** Latest deposits appeared at the bottom of the list (ascending ID order). Both sender and receiver dashboards showed oldest buckets first.

**Fix:** Added `.reverse()` to the `fetchBucketBalances` return value. Latest bucket (highest ID) now appears at the top on both dashboards.

---

## Fix 7: CI/CD — Force Fresh Remote Build

**Commit:** `f27ac3e`  
**Issue:** The `vercel build` + `vercel deploy --prebuilt` approach was consistently serving stale JavaScript chunks despite cache-clearing steps. The local build cache persisted across GitHub Actions runs.

**Fix:** Replaced the two-step process (`vercel build` → `vercel deploy --prebuilt`) with a single `vercel deploy --prod --force` command, which triggers a **fresh remote build** on Vercel's infrastructure. This completely bypasses local caching issues.

| Before | After |
|--------|-------|
| `rm -rf .vercel/cache .next/cache` | Removed |
| `vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}` | Removed |
| `vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}` | Replaced |
| — | `vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} --force` |

---

## Remaining Known Issues

| Issue | Impact | Workaround |
|-------|--------|------------|
| React prop pipeline drops certain props (custom fields, callbacks) | Medium — forced workarounds in `GoalBucketCard` and `SenderBucketCard` | Direct contract reads from within UI components |
| No unit tests for the new frontend components | Low — tested manually end-to-end | Manual QA before each deploy |
| Contract WASM redeploy required for any backend fix | Medium — breaks existing buckets on old contract | Update env vars and make new deposits |

---

## Files Modified (Since Implementation Report)

| File | Commits |
|------|---------|
| `contracts/ingat-vault/src/withdraw.rs` | 1 |
| `apps/web/lib/stellar/client.ts` | 1 |
| `apps/web/lib/utils/constants.ts` | 1 |
| `apps/web/lib/stellar/contract/queries.ts` | 1 |
| `apps/web/components/ui/buckets/GoalBucketCard.tsx` | 4 |
| `apps/web/components/ui/dashboard/SenderBucketCard.tsx` | 1 |
| `apps/web/.env.example` | 1 |
| `README.md` | 1 |
| `vercel.json` | 1 |
| `.github/workflows/deploy.yml` | 1 |
| `docs/deployments.md` | 1 |
| `docs/testing-guide.md` | 1 |
