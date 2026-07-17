# Phase 4 — Milestone / Condition Unlock: Implementation Summary

**Date:** 2026-07-17  
**Branch:** `main` (squashed from `feat/phase-4-condition-unlock`)  
**Contract:** v2.0.0 — deployed at `CAB4QC535QY7VCNKUC7S7SMC4MA6TUFUAYAIZLYRPYUILYKTRDLSQPNT`

---

## Feature Overview

Adds a **TimeAndApproval** mode for Goal buckets. When enabled at deposit time, the receiver cannot withdraw the goal funds immediately after `unlock_date` — they must first request release, and the sender must approve (or a 7-day grace period auto-releases).

### Key Behaviours

| State | Receiver sees | Sender sees |
|-------|---------------|-------------|
| Before `unlock_date` | "Request Early Access" only | — |
| After `unlock_date`, not requested | "Request Release" button | — |
| Release requested, pending | "Release requested — awaiting sender approval" | Amber banner with "Approve Release" button |
| Release approved | "Withdraw Unlocked Savings" | Green "Release Approved" banner |
| 7 days elapsed after request | "Withdraw Unlocked Savings" (auto) | — |

---

## Files Changed

### Contract (Rust) — `contracts/ingat-vault/src/`

| File | Change |
|------|--------|
| `storage.rs` | Added `approval_required: bool` to `BucketState`. Added `ReleaseStatus` enum, `ReleaseRequest` struct, `DataKey::ReleaseReq`, get/set storage functions. |
| `errors.rs` | Added 6 error variants: `BucketNotTimeAndApproval`, `ReleaseRequestAlreadyActive`, `NoActiveReleaseRequest`, `ReleaseNotApproved`, `ReleaseGracePeriodNotElapsed`, `SenderCannotRequestRelease`. |
| `deposit.rs` | Added `approval_required: bool` parameter. |
| `release.rs` (new) | `request_release()`, `approve_release()`, `can_withdraw_goal()`, `get_release_request()`. Grace period = 7 days (604,800 seconds). |
| `withdraw.rs` | Both `withdraw_goal` and `withdraw_goal_sender` now call `release::can_withdraw_goal()` to check unlock + approval/grace status. |
| `lib.rs` | Added `release` module, 3 new entry points (`request_release`, `approve_release`, `get_release_request`), updated `deposit` signature. |

### Tests — `contracts/ingat-vault/tests/vault_test.rs`

- 21 existing tests updated with `&false` for `approval_required` param
- 6 new tests (27 total, all pass):
  - `test_release_before_unlock_date_fails`
  - `test_release_on_non_approval_bucket_fails`
  - `test_request_release_and_approve_happy_path`
  - `test_double_release_request_fails`
  - `test_grace_period_auto_release`
  - `test_third_party_cannot_approve_release`

### Frontend (TypeScript / React)

| File | Change |
|------|--------|
| `lib/stellar/contract/deposits.ts` | Added `approval_required: bool` as 6th ScVal parameter to deposit XDR builder. |
| `lib/stellar/contract/release.ts` (new) | XDR builders for `request_release` and `approve_release`. |
| `lib/stellar/contract/queries.ts` | Parses `approval_required` from contract response. `fetchReleaseRequest()` helper. |
| `lib/stellar/contract.ts` | Barrel export of `release.ts`. |
| `types/bucket.ts` | `approvalRequired` added to `BucketState`. `ReleaseRequest` and `ReleaseStatus` types added. |
| `types/transaction.ts` | `approvalRequired` added to `DepositFormInputs` and `DepositParams`. |
| `hooks/useDeposit.ts` | Passes `approvalRequired` to `buildDepositTx`. |
| `components/ui/deposit/DepositForm.tsx` | Toggle switch for "Require Sender Approval". |
| `components/ui/deposit/DepositConfirmModal.tsx` | Shows approval mode info in confirmation. |
| `components/ui/buckets/GoalBucketCard.tsx` | Request Release button, local polling of release status, local approve handler (bypassing props). |
| `components/ui/dashboard/SenderBucketCard.tsx` | Approve Release banner, local polling of release requests, local approval handler (bypassing props). |
| `components/containers/ReceiverDashboardContainer.tsx` | Handles release request flow (contained within GoalBucketCard now). |
| `components/containers/SenderDashboardContainer.tsx` | Handles approve release flow (contained within SenderBucketCard now). |

### Configuration & Deployment

| File | Change |
|------|--------|
| `apps/web/.env.example` | Updated contract ID and token ID. |
| `apps/web/lib/stellar/client.ts` | Hardcoded fallback for contract and token IDs. |
| `apps/web/lib/utils/constants.ts` | Same fallback. |
| `vercel.json` | Added env block (fallback for Vercel dashboard variables). |
| `.github/workflows/deploy.yml` | Added cache-clearing steps, build cache bust env var, env override steps. |
| `docs/deployments.md` | Updated contract ID, WASM hash, verification entries. |
| `docs/testing-guide.md` | Updated CLI commands with `--approval_required` param. |
| `docs/specs.md` | Added Phase 4b section. |

---

## The Prop Pipeline Bug

### What happened

Data that was correctly parsed, set, and returned from `fetchBucketBalances` arrived as `undefined` or `false` in child components despite being correctly passed in JSX. This affected multiple fields:

- `approvalRequired` — set to `true` in mapping, arrived as `false`
- `_canRequestRelease` — set to `true` in release handler, arrived as `false`
- `_reqFetched` — same pattern, same result
- `releaseRequest` — set in handler, arrived as `undefined`
- `onRequestRelease` — inline arrow function passed as prop, arrived as `undefined`
- `onApproveRelease` — same pattern, same result

### Evidence

- `console.warn` inside `fetchBucketBalances` confirmed `appr: true, req: true`
- SDK v16 `scValToNative` directly tested and confirmed `approval_required: true`
- Smart contract CLI call confirmed `approval_required: true` in response
- `[INGAT_FINAL]` log showed `appr: true` at the function return point
- `[CLICK]` log showed `handler: undefined` at the component receiving end
- Hardcoding `approvalRequired=true` or `effectiveApprovalRequired=true` inside the component worked correctly

### Suspected causes (unconfirmed)

| Hypothesis | Likelihood | Why |
|-----------|------------|-----|
| **Vercel build cache** serving stale chunks | Medium | Cleaning cache repeatedly fixed some issues temporarily. Chunk file names changed but content was sometimes stale. |
| **React reconciliation dropping props** | Low | Only custom-added props were dropped; existing props (`balance`, `unlockDate`, etc.) worked fine. |
| **TypeScript/tree-shaking stripping runtime properties** | Low | TypeScript is compile-time only. Hardcoded `true` inside components worked. |
| **Turbopack compilation error** | Medium | Prop names containing underscore (`_canRequestRelease`, `_reqFetched`, `_isApprovalBucket`) all failed, while simpler names (`approvalRequired`) also failed. |

### Workaround

Both `GoalBucketCard` and `SenderBucketCard` now:

1. **Import contract functions directly** (`fetchReleaseRequest`, `buildRequestReleaseTx`, `buildApproveReleaseTx`)
2. **Use `useWalletContext()`** to get the public key
3. **Poll the contract** every 10 seconds for release request status
4. **Handle transactions locally** within the component

This bypasses the prop pipeline entirely. The tradeoff is that these UI components now violate the project convention (`components/ui/` should be props-only with no hooks or chain calls).

### Recommended fix (post-hackathon)

1. Create a new wrapper (e.g., `RequestReleaseWrapper` or add to the container) that exclusively owns the release flow state
2. Remove all direct contract imports from `GoalBucketCard` and `SenderBucketCard`
3. Pass only primitive props (`boolean`, `string`, `number`) — avoid passing objects or callbacks with special characters in their names
4. Test with a clean Vercel deployment (no remote cache)
5. If props still fail, investigate Turbopack plugin configuration or Next.js middleware that might be filtering certain prop names

---

## Contract Functions (16 total)

| Function | Status |
|----------|--------|
| `initialize` | Original |
| `deposit` | Modified — added `approval_required: bool` |
| `withdraw_spending` | Original |
| `withdraw_goal` | Modified — checks `can_withdraw_goal` |
| `withdraw_goal_sender` | Modified — checks `can_withdraw_goal` |
| `request_emergency_withdrawal` | Original |
| `cancel_emergency_withdrawal` | Original |
| `cancel_emergency_receiver` | Original |
| `execute_emergency_withdrawal` | Original |
| `get_emergency_request` | Original |
| **`request_release`** | **New** |
| **`approve_release`** | **New** |
| **`get_release_request`** | **New** |
| `get_buckets` | Original (now returns `approval_required`) |
| `get_token` | Original |

---

## End-to-End Flow

```
Sender deposits (approval_required=true)
  → Receiver sees locked bucket
  → unlock_date passes
  → Receiver clicks "Request Release"
  → Transaction submitted, status: Pending
  → Sender sees amber banner
  → Sender clicks "Approve Release"
  → Transaction submitted, status: Approved
  → Receiver sees "Withdraw Unlocked Savings"
  → Receiver withdraws
  → Done
```

Alternative path:
```
  → Sender never responds
  → 7-day grace period elapses
  → Receiver sees "Withdraw Unlocked Savings" (auto-release)
  → Receiver withdraws
  → Done
```
