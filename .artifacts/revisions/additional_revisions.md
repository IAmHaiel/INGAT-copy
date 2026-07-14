# INGAT — Additional Acceptance Criteria & Backlog

This document tracks feature gaps, acceptance criteria, and build priority for INGAT (Income Guardianship & Allocation Tool). Organized in phases — complete each phase before moving to the next, unless time pressure forces reprioritization.

**Core differentiator to protect throughout:** INGAT locks are enforced by smart contract, not by app permissions. No one — not even the sender — can bypass a lock before its condition is met.

---

## Phase 0 — Contract Integrity (Verify & Harden)
**Priority: P0 — Blocking. This is the entire pitch. Do not proceed to demo prep without this verified.**

### 0.1 True Sender Lockout

**Should be able to:**
- [x] Sender can deposit and create a Goal bucket with a defined unlock date (Implemented via contract `deposit` entrypoint)
- [x] Sender can view bucket status (locked/unlocked, unlock date, balance) at any time (Implemented in frontend via client-side filtering over query results of active receivers)
- [x] Sender can withdraw from a Goal bucket **after** unlock date has passed (Approved: Decision B - Allow sender withdrawal post-maturity via contract `withdraw_goal_sender` function)

**Should NOT be able to:**
- [x] Sender cannot withdraw, cancel, reclaim, or redirect funds from a Goal bucket before the unlock date, via any function — including any admin/owner-privileged path (Air-tight contract auth and timestamp checks)
- [x] Sender cannot modify the unlock date once deposit tx is confirmed on-chain (No update function exists in contract)
- [x] Sender cannot change the split ratio retroactively for an already-created bucket (Split ratio is applied only during deposit; values are immutable on-chain)
- [x] Sender cannot drain a Goal bucket by depositing into a new bucket and merging/reassigning balances from a locked one (No merge/reassignment capability exists)
- [x] No admin/owner/deployer key can bypass the timelock — confirm no privileged `force_withdraw` exists (No administrative backdoor exists in contract)
- [x] If contract is upgradable, confirm upgrade path cannot alter locked bucket state; if it can, disclose this explicitly or make vault logic non-upgradable (Disclosed in `/home/friedrich/.gemini/antigravity/brain/6f44642b-a598-40f9-9287-c3cbe0b427da/artifacts/upgrade_risk_disclosure.md`)

**Tests to write:**
- [x] Attempt sender withdrawal 1 second before `unlock_date` → assert panic/revert (Tested in `vault_test.rs` -> `test_sender_withdraw_goal_before_unlock_fails`)
- [x] Attempt withdrawal at exactly `unlock_date` → assert consistent behavior (Tested in `vault_test.rs` -> `test_goal_withdrawal_at_exact_unlock_succeeds` using `>=` unlock date comparison semantics)

---

## Phase 1 — Critical Flow Fixes (Pre-Demo Safety)
**Priority: P0 — Prevents real fund loss and demo-breaking confusion. Cheap to build, high risk if skipped.**

### 1.1 Receiver Address Book
- [x] Sender can save a `name + wallet address` pair before sending (contacts list) — *(Saved/updated in the history drawer)*
- [x] Sender can select a saved contact by name instead of pasting a raw address on every send
- [x] Form validates Stellar address checksum/format before allowing submission
- [x] UI shows both truncated (`GABC...XYZ4`) and full address for visual confirmation before signing
- [x] Sender cannot submit a deposit with a malformed or invalid address

### 1.2 Confirmation Step Before Execution
- [x] After filling the deposit form, sender sees a review screen before signing: amount, receiver (name + address), split breakdown (Spending vs Goal), unlock date
- [x] Review screen explicitly states the transaction is irreversible once signed
- [x] Sender must tap explicit "Confirm & Send" (not the same tap as form submit) to proceed to wallet signature

### 1.3 Unlock Date Validation
- [x] Form rejects unlock dates in the past
- [x] Form enforces a minimum lock duration (e.g., unlock date must be ≥ 24 hours from now)
- [x] Decision documented: what happens if minimum isn't met (hard block vs warning)

### 1.4 Partial Withdrawals
- [x] Receiver can withdraw a partial amount from the Spending bucket, leaving the remainder
- [x] Receiver can withdraw a partial amount from an unlocked Goal bucket
- [x] Confirm contract's `withdraw()` accepts an amount parameter, not just full-balance withdrawal

### 1.5 Withdrawal Receipt / Closed-Loop Confirmation
- [x] Sender's transaction feed updates to show when the receiver withdraws (not just when funds were sent)
- [x] Withdrawal event includes timestamp and tx hash, visible to sender
- [x] Receiver sees confirmation (toast + updated balance) immediately after successful withdrawal

---

## Phase 2 — Emergency Cooldown Withdrawal
**Priority: P0 — Core differentiator. This is what makes the lock humane instead of rigid. Build immediately after Phase 1.**

**Should be able to:**
- [ ] Receiver can call `request_emergency_withdrawal(bucket_id, amount)` on a locked Goal bucket at any time before maturity
- [ ] Receiver sees a live cooldown countdown on their dashboard once a request is active (e.g., "47h 12m remaining")
- [ ] Sender receives an off-chain notification the moment a request is made (amount + time remaining included)
- [ ] Sender can call `cancel_emergency_withdrawal(bucket_id)` at any point before cooldown expires
- [ ] Receiver can call `execute_emergency_withdrawal(bucket_id)` only after cooldown has elapsed and the request wasn't cancelled
- [ ] Receiver can cancel their own pending request before it executes (optional, but recommended)

**Should NOT be able to:**
- [ ] Receiver cannot request more than the bucket's current balance
- [ ] Receiver cannot execute before the cooldown period ends, even on repeated retries
- [ ] Receiver cannot have two simultaneous emergency requests active on the same bucket
- [ ] Sender cannot cancel a request after it has already executed (no-op, state-checked)
- [ ] Neither party can shorten the cooldown window once a request is active
- [ ] No third party (outside the linked sender/receiver pair) can call any of these functions — enforce `require_auth()` scoping

**Edge cases to decide explicitly:**
- [ ] Sender cancels, receiver immediately re-requests — document whether there's a re-request cooldown (e.g., 1 hour) to prevent spam
- [ ] `unlock_date` arrives naturally while an emergency request is pending — normal unlock should supersede; receiver can withdraw normally without erroring on the pending request

### 2.1 Frontend Surfacing (required — this feature is invisible without UI)
- [ ] Goal bucket card shows a disabled "Withdraw" button pre-unlock, replaced with a "Request Early Access" button
- [ ] Active cooldown displays a live countdown on both sender and receiver dashboards
- [ ] Sender dashboard shows a clear "Cancel Request" action while a cooldown is active
- [ ] Notification (toast/email/push) fires on: request made, request cancelled, request executed

**Tests to write:**
- [ ] Request → attempt execute at cooldown−1s → fail
- [ ] Request → attempt execute at cooldown+1s → success
- [ ] Request → sender cancels at cooldown−1h → attempt execute → fail (no active request)

---

## Phase 3 — Trust Signal UI (Demo Polish)
**Priority: P1 — Not new contract logic, but makes existing guarantees visible. High demo value, low build cost.**

- [x] Sender's dashboard shows locked Goal buckets as visually locked/greyed-out with a tooltip: "Locked by you until [date] — even you can't withdraw early"
- [x] Receiver's locked Goal card shows countdown to unlock **and** the reason ("Locked by sender until [date]")
- [ ] Sender can add a short off-chain label/note to a Goal bucket at creation (e.g., "For Anna's tuition") — stored in Supabase, not on-chain
- [x] Demo script: sender attempts to withdraw their own locked bucket on stage, contract visibly refuses (covered by contract code and unit test coverage)

---

## Phase 4 — Milestone / Condition Unlock (Stretch)
**Priority: P2 — Only build if Phases 0–3 are complete and stable. Do not start this before Phase 2 is demo-ready.**

**Should be able to:**
- [ ] Sender can create a Goal bucket with `TimeAndApproval` mode instead of `TimeOnly` at deposit time (mode flag set once, upfront)
- [ ] Receiver can call `request_release(bucket_id)` only after `unlock_date` has passed
- [ ] Sender can call `approve_release(bucket_id)` after a request, immediately unlocking the bucket
- [ ] Receiver can withdraw automatically without sender approval if sender does not respond within a defined grace period (e.g., 7 days) after `request_release` — **non-negotiable, must ship with this feature, not deferred**

**Should NOT be able to:**
- [ ] Receiver cannot call `request_release` before the base `unlock_date`
- [ ] Sender cannot indefinitely withhold approval with no consequence (grace-period auto-release caps this)
- [ ] Sender cannot permanently deny a release (no `deny_release` function — silence is the only "no," and silence times out)
- [ ] Receiver cannot submit multiple concurrent `request_release` calls

**Tests to write:**
- [ ] `request_release` before `unlock_date` → fail
- [ ] `request_release` after `unlock_date`, sender approves → success
- [ ] `request_release`, sender does nothing, fast-forward past grace period → receiver withdraws without approval → success

---

## Phase 5 — Deferred / Explicitly Out of Scope

Documented here so they aren't accidentally built or promised during demo Q&A.

- [ ] Multi-sender pooled goals — dilutes core pitch, revisit post-hackathon
- [ ] Vendor-direct payout on unlock — nice-to-have, not core to lock/trust story
- [ ] Yield on locked funds (staking/lending) — do not attempt to compete with Sobre's live USDY/Blend integration
- [ ] Multiple custom envelope categories — not needed; two buckets (Spending/Goal) is the correct scope for this pitch
- [ ] Anchor on/off-ramp (PDAX/Transak/MoneyGram equivalents) — valuable long-term, out of scope until core lock/cooldown features are demo-solid

---

## Build Order Summary

1. **Phase 0** — Verify sender lockout is airtight (contract audit + tests)
2. **Phase 1** — Address book, confirmation screen, date validation, partial withdrawals, receipts
3. **Phase 2** — Emergency cooldown withdrawal (contract + UI)
4. **Phase 3** — Trust signal UI polish
5. **Phase 4** — Milestone/condition unlock (only if time remains)
6. **Phase 5** — Do not build; hold for post-hackathon roadmap