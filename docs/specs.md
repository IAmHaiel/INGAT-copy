# INGAT — Income Guardianship & Allocation Tool

> **INGAT** (Tagalog: "take care" — traditionally said to someone leaving for abroad) is a Stellar/Soroban-based remittance splitting protocol that lets OFWs enforce how their money is used the moment it arrives, without needing to trust after the fact.

---

## Problem

OFWs send remittances home as a single lump sum. Once the money lands, the sender has no control over how it's spent. Savings goals — tuition, emergency funds, house payments — routinely get absorbed into daily spending because there's no mechanism separating "money to live on" from "money to protect." The sender is thousands of miles away and has to trust that discipline holds. It usually doesn't, not because families are careless, but because undivided money is easy to spend.

## Solution

A Soroban smart contract that splits an incoming stablecoin deposit into two on-chain buckets at the moment of arrival:

- **Spending Bucket** — freely withdrawable by the receiving family, for daily expenses.
- **Goal Bucket** — locked until a sender-defined unlock date, protecting savings from impulse spending.

The sender sets the split ratio and lock date when depositing. The receiver sees a simple wallet view with two balances — the complexity of the lock lives entirely in the contract, not in their daily experience.

---

## Features

### Module: Wallet Connection
Connect a Stellar wallet (Freighter) to identify the user as Sender or Receiver and authorize transactions.

**Acceptance Criteria**
- [x] User can connect Freighter wallet from the landing page.
- [x] Connected public key is displayed in the header once connected.
- [x] App detects and blocks unsupported wallets/networks (must be Stellar testnet).
- [x] Disconnecting wallet returns user to landing/connect state.

**Screens:** `Landing / Connect Wallet`

---

### Module: Deposit & Split Configuration
Sender deposits a stablecoin amount and defines how it splits between Spending and Goal buckets, plus the Goal bucket's unlock date.

**Acceptance Criteria**
- [x] Sender can input deposit amount, split percentage (e.g. 60/40), and unlock date for the Goal bucket.
- [x] Contract call creates/updates bucket balances on-chain, tied to the receiver's address.
- [x] Split percentage must total 100%; invalid input is rejected client-side before submission.
- [x] Unlock date must be a future date; past dates are rejected client-side.
- [x] On successful deposit, sender sees confirmation with transaction hash.
- [x] Failed transactions show a clear error state (insufficient balance, rejected signature, network error).

**Screens:** `Sender Dashboard`, `New Deposit Form`, `Transaction Confirmation`

---

### Module: Bucket Balances (Receiver View)
Receiver views their Spending and Goal bucket balances in a simple, non-technical wallet interface.

**Acceptance Criteria**
- [x] Receiver sees Spending Bucket balance and Goal Bucket balance as two distinct cards.
- [x] Goal Bucket displays lock status: locked (with unlock date) or unlocked (withdrawable).
- [x] Balances reflect on-chain contract state, refreshed on page load and after any transaction.

**Screens:** `Receiver Dashboard`

---

### Module: Withdrawal
Receiver withdraws from the Spending Bucket at any time; Goal Bucket withdrawal is only enabled after the unlock date.

**Acceptance Criteria**
- [x] Withdraw action on Spending Bucket succeeds at any time, deducting from on-chain balance.
- [x] Withdraw action on Goal Bucket is disabled (visibly, not just silently) before unlock date.
- [x] Withdraw action on Goal Bucket succeeds once current time ≥ unlock date, enforced by the contract, not just the UI.
- [x] Withdrawal updates displayed balance immediately on confirmation.

**Screens:** `Receiver Dashboard` (withdraw actions inline), `Transaction Confirmation`

---

### Module: Allocation History
Sender can view a log of past deposits and how each was split, for transparency.

**Acceptance Criteria**
- [x] Sender Dashboard lists past deposits with amount, split ratio, unlock date, and timestamp.
- [x] History is read from on-chain contract events/state, not a separate off-chain database.
- [x] Empty state shown clearly if no deposits exist yet.

**Screens:** `Sender Dashboard` (history section)

---

## Roles

### Sender (OFW)
- Connects wallet, deposits stablecoin, sets split ratio and lock date, views allocation history.

### Receiver (Family)
- Connects wallet, views bucket balances, withdraws from Spending Bucket freely, withdraws from Goal Bucket once unlocked.

*(No admin, approver, or auditor role in this scope — kept deliberately to two roles.)*

---

## Phases of Development

### Phase 1: Contract Core ✅
**Modules:** Deposit & Split Configuration (contract logic), Withdrawal (contract logic)

**Build:**
- [x] Soroban contract with `deposit(sender, receiver, amount, split_ratio, unlock_date)` function
- [x] Bucket state storage per receiver address (spending balance, goal balance, unlock date)
- [x] `withdraw_spending(receiver, amount)` function, always callable
- [x] `withdraw_goal(receiver, amount)` function, callable only if `current_time >= unlock_date`
- [x] Deploy to Stellar testnet

**Acceptance Criteria**
- [x] Contract correctly splits a deposited amount per the given ratio and stores it against the receiver's address.
- [x] `withdraw_goal` reverts if called before unlock date; succeeds after.
- [x] `withdraw_spending` always succeeds if balance is sufficient.
- [x] All functions tested manually via Soroban CLI against testnet before frontend integration.

---

### Phase 2: Wallet & Sender Flow ✅
**Modules:** Wallet Connection, Deposit & Split Configuration (UI), Allocation History

**Build:**
- [x] Freighter wallet connect flow
- [x] Sender Dashboard with New Deposit Form (amount, split ratio, unlock date inputs)
- [x] Transaction Confirmation screen/state
- [x] Allocation history list pulling from contract state/events

**Acceptance Criteria**
- [x] Sender can complete a full deposit flow from connect → form → confirmation without errors.
- [x] Invalid split ratios or past unlock dates are caught before submission.
- [x] Allocation history accurately reflects all deposits made by the connected sender.

---

### Phase 3: Receiver Flow ✅
**Modules:** Bucket Balances (Receiver View), Withdrawal

**Build:**
- [x] Receiver Dashboard with Spending Bucket and Goal Bucket cards
- [x] Withdraw action for Spending Bucket
- [x] Withdraw action for Goal Bucket, disabled/enabled based on unlock date
- [x] Balance refresh after transactions

**Acceptance Criteria**
- [x] Receiver can withdraw from Spending Bucket at any time and see balance update.
- [x] Receiver cannot withdraw from Goal Bucket before unlock date (UI disabled + contract enforced).
- [x] Receiver can withdraw from Goal Bucket after unlock date.

---

### Phase 4: Polish & Demo Readiness ✅
**Modules:** All (cross-cutting)

**Build:**
- [x] Error states for failed transactions across all flows
- [x] Empty states (no deposits yet, no history yet)
- [x] Visual pass on both dashboards for demo clarity
- [x] Seed a demo deposit with a near-term unlock date for live demo purposes

**Acceptance Criteria**
- [x] All error and empty states are handled, no raw errors surfaced to the user.
- [x] Full sender → receiver flow can be demoed end-to-end on testnet without manual console intervention.

---

## Tech Stack

- **Smart Contract:** Rust + Soroban SDK, deployed to Stellar testnet
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Wallet Integration:** `@stellar/freighter-api`
- **Stellar SDK:** `@stellar/stellar-sdk` for transaction building/submission
- **State Source of Truth:** on-chain contract storage — no backend database in this scope

## Platform Decision

**Web only.** Freighter is a browser extension, making web wallet connection trivial versus the added complexity of mobile wallet deep-linking. Judges and demos happen on laptops. Web keeps scope achievable without sacrificing demo quality.
