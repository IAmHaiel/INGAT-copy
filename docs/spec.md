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
- User can connect Freighter wallet from the landing page.
- Connected public key is displayed in the header once connected.
- App detects and blocks unsupported wallets/networks (must be Stellar testnet).
- Disconnecting wallet returns user to landing/connect state.

**Screens:** `Landing / Connect Wallet`

---

### Module: Deposit & Split Configuration
Sender deposits a stablecoin amount and defines how it splits between Spending and Goal buckets, plus the Goal bucket's unlock date.

**Acceptance Criteria**
- Sender can input deposit amount, split percentage (e.g. 60/40), and unlock date for the Goal bucket.
- Contract call creates/updates bucket balances on-chain, tied to the receiver's address.
- Split percentage must total 100%; invalid input is rejected client-side before submission.
- Unlock date must be a future date; past dates are rejected client-side.
- On successful deposit, sender sees confirmation with transaction hash.
- Failed transactions show a clear error state (insufficient balance, rejected signature, network error).

**Screens:** `Sender Dashboard`, `New Deposit Form`, `Transaction Confirmation`

---

### Module: Bucket Balances (Receiver View)
Receiver views their Spending and Goal bucket balances in a simple, non-technical wallet interface.

**Acceptance Criteria**
- Receiver sees Spending Bucket balance and Goal Bucket balance as two distinct cards.
- Goal Bucket displays lock status: locked (with unlock date) or unlocked (withdrawable).
- Balances reflect on-chain contract state, refreshed on page load and after any transaction.

**Screens:** `Receiver Dashboard`

---

### Module: Withdrawal
Receiver withdraws from the Spending Bucket at any time; Goal Bucket withdrawal is only enabled after the unlock date.

**Acceptance Criteria**
- Withdraw action on Spending Bucket succeeds at any time, deducting from on-chain balance.
- Withdraw action on Goal Bucket is disabled (visibly, not just silently) before unlock date.
- Withdraw action on Goal Bucket succeeds once current time ≥ unlock date, enforced by the contract, not just the UI.
- Withdrawal updates displayed balance immediately on confirmation.

**Screens:** `Receiver Dashboard` (withdraw actions inline), `Transaction Confirmation`

---

### Module: Allocation History
Sender can view a log of past deposits and how each was split, for transparency.

**Acceptance Criteria**
- Sender Dashboard lists past deposits with amount, split ratio, unlock date, and timestamp.
- History is read from on-chain contract events/state, not a separate off-chain database.
- Empty state shown clearly if no deposits exist yet.

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

### Phase 1: Contract Core
**Modules:** Deposit & Split Configuration (contract logic), Withdrawal (contract logic)

**Build:**
- Soroban contract with `deposit(sender, receiver, amount, split_ratio, unlock_date)` function
- Bucket state storage per receiver address (spending balance, goal balance, unlock date)
- `withdraw_spending(receiver, amount)` function, always callable
- `withdraw_goal(receiver, amount)` function, callable only if `current_time >= unlock_date`
- Deploy to Stellar testnet

**Acceptance Criteria**
- Contract correctly splits a deposited amount per the given ratio and stores it against the receiver's address.
- `withdraw_goal` reverts if called before unlock date; succeeds after.
- `withdraw_spending` always succeeds if balance is sufficient.
- All functions tested manually via Soroban CLI against testnet before frontend integration.

---

### Phase 2: Wallet & Sender Flow
**Modules:** Wallet Connection, Deposit & Split Configuration (UI), Allocation History

**Build:**
- Freighter wallet connect flow
- Sender Dashboard with New Deposit Form (amount, split ratio, unlock date inputs)
- Transaction Confirmation screen/state
- Allocation history list pulling from contract state/events

**Acceptance Criteria**
- Sender can complete a full deposit flow from connect → form → confirmation without errors.
- Invalid split ratios or past unlock dates are caught before submission.
- Allocation history accurately reflects all deposits made by the connected sender.

---

### Phase 3: Receiver Flow
**Modules:** Bucket Balances (Receiver View), Withdrawal

**Build:**
- Receiver Dashboard with Spending Bucket and Goal Bucket cards
- Withdraw action for Spending Bucket
- Withdraw action for Goal Bucket, disabled/enabled based on unlock date
- Balance refresh after transactions

**Acceptance Criteria**
- Receiver can withdraw from Spending Bucket at any time and see balance update.
- Receiver cannot withdraw from Goal Bucket before unlock date (UI disabled + contract enforced).
- Receiver can withdraw from Goal Bucket after unlock date.

---

### Phase 4: Polish & Demo Readiness
**Modules:** All (cross-cutting)

**Build:**
- Error states for failed transactions across all flows
- Empty states (no deposits yet, no history yet)
- Visual pass on both dashboards for demo clarity
- Seed a demo deposit with a near-term unlock date for live demo purposes

**Acceptance Criteria**
- All error and empty states are handled, no raw errors surfaced to the user.
- Full sender → receiver flow can be demoed end-to-end on testnet without manual console intervention.

---

## Tech Stack

- **Smart Contract:** Rust + Soroban SDK, deployed to Stellar testnet
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Wallet Integration:** `@stellar/freighter-api`
- **Stellar SDK:** `@stellar/stellar-sdk` for transaction building/submission
- **State Source of Truth:** on-chain contract storage — no backend database in this scope

## Platform Decision

**Web only.** Freighter is a browser extension, making web wallet connection trivial versus the added complexity of mobile wallet deep-linking. Judges and demos happen on laptops. Web keeps scope achievable without sacrificing demo quality.