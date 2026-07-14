# INGAT — Testing & Usage Guide

This guide walks you through testing the full INGAT flow end-to-end on Stellar Testnet.

---

## Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| [Node.js v20+](https://nodejs.org/) | Frontend dev server | `nvm install 20` |
| [Freighter Wallet](https://www.freighter.app/) | Browser wallet extension | Chrome/Firefox extension |
| [Stellar CLI](https://developers.stellar.org/docs/tools/cli) | Contract interaction & account setup | `cargo install --locked stellar-cli --features opt` |

---

## 1. Environment Setup

```bash
# Clone and install
git clone https://github.com/your-org/ingat.git
cd ingat
npm install

# Start the dev server
npm run dev
```

The app runs at `http://localhost:3000`.

---

## 2. Freighter Wallet Setup

### Install & Configure

1. Install the [Freighter browser extension](https://www.freighter.app/)
2. Create or import a wallet
3. **Switch to Testnet:**
   - Open Freighter → Settings (gear icon) → Network → Select **Testnet**
   - INGAT will block connections on any other network

### Fund Your Account

Your testnet account needs XLM for both transaction fees and deposits:

1. Copy your Freighter public key (starts with `G...`)
2. Fund it via Friendbot (gives you 10,000 XLM for free):
   ```bash
   curl "https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY_HERE"
   ```

> **That's it!** Unlike stablecoins, native XLM requires no trustline or minting step. Any funded account can immediately deposit and withdraw.

---

## 3. Testing the Sender Flow

### Connect Wallet

1. Open `http://localhost:3000`
2. Click **"Connect Wallet"**
3. Approve the connection in Freighter popup
4. Your public key appears in the header
5. Select **"I am the Sender (OFW)"**

### Create a Deposit

1. On the Sender Dashboard, click **"Create Split Remittance"**
2. Fill in the form:
   - **Receiver Address:** A valid Stellar public key (the receiver's Freighter address)
   - **Amount:** e.g., `20` (XLM) — the USD equivalent is shown below
   - **Split Ratio:** e.g., `60%` spending / `40%` goal
   - **Unlock Date:** A future date (for testing, pick a date 5 minutes from now)
3. Click **"Execute Remittance Split"**
4. Approve the transaction in Freighter
5. Wait for on-chain confirmation → redirected to Transaction Confirmation screen

### View Allocation History

After depositing, return to the Sender Dashboard. The **Allocation History** section shows your deposit pulled from on-chain events, including:
- Receiver address
- Amount in XLM with USD equivalent
- Split ratio
- Unlock date
- Transaction link to Stellar Explorer

> **Note:** History reads from Soroban RPC events (last 24h). Very old deposits may not appear.

---

## 4. Testing the Receiver Flow

### Switch Accounts

1. Open Freighter and switch to the **receiver** account
2. Or open INGAT in an incognito window with a different Freighter profile
3. Navigate to `http://localhost:3000`
4. Connect the receiver's wallet
5. Select **"I am the Receiver"**

### View Buckets

The Receiver Dashboard shows two cards:
- **Spending Bucket** — Available XLM balance (+ USD equivalent), withdraw anytime
- **Goal Bucket** — Locked XLM balance with unlock countdown timer

### Withdraw from Spending Bucket

1. On the Spending Bucket card, enter a withdrawal amount (in XLM)
2. Click **"Withdraw"**
3. Approve in Freighter
4. Balance updates after confirmation

### Withdraw from Goal Bucket (Locked)

1. If the unlock date hasn't passed, the Goal Bucket shows a **lock icon** and the withdraw button is disabled
2. The countdown shows time remaining

### Withdraw from Goal Bucket (Unlocked)

1. Once the current time ≥ unlock date, the Goal Bucket shows **"Unlocked"**
2. Enter an amount and click **"Withdraw"**
3. Approve in Freighter
4. Funds released to your account

---

## 5. Testing Edge Cases

### Invalid Inputs (Client-Side Validation)

| Test | Expected |
|------|----------|
| Empty receiver address | Error: "Receiver address is required" |
| Invalid address (not G... or wrong length) | Error: "Invalid Stellar public key format" |
| Amount = 0 or negative | Error: "Amount must be a positive number" |
| Split ratio outside 0-100 | Error: "Split ratio must be between 0% and 100%" |
| Unlock date in the past | Error: "Unlock date must be in the future" |

### Network Errors (Contract-Level)

| Test | Expected |
|------|----------|
| Withdraw more than bucket balance | Transaction fails: "Insufficient funds" |
| Withdraw from Goal before unlock | Transaction fails: "Goal bucket locked" |
| Deposit with insufficient XLM balance | Transaction fails on-chain |
| Reject transaction in Freighter | Error state shown, no funds moved |

### Wallet/Network Detection

| Test | Expected |
|------|----------|
| Connect with Freighter on Mainnet | Error: "Please switch Freighter to Stellar Testnet to use INGAT" |
| Connect with Freighter on Futurenet | Same error — only Testnet allowed |
| No Freighter installed | Error: "Freighter wallet extension is not installed" |
| Disconnect wallet | Returns to landing page |

---

## 6. CLI-Only Testing (No Frontend)

You can test the contract directly using the Stellar CLI:

```bash
# Set up identities (if not already)
stellar keys generate sender --network testnet
stellar keys generate receiver --network testnet

SENDER=$(stellar keys address sender)
RECEIVER=$(stellar keys address receiver)
CONTRACT=CCQGNVUCCAO6WNBXEHT3ZMPB5L57HZJLBIGPY27VSLJMTLVTZJUUINEQ

# Deposit 20 XLM (7 decimals = 200000000 stroops) with 60/40 split, unlock in 5 minutes
UNLOCK=$(($(date +%s) + 300))

stellar contract invoke \
  --id $CONTRACT \
  --network testnet \
  --source sender \
  -- deposit \
  --sender $SENDER \
  --receiver $RECEIVER \
  --amount 200000000 \
  --split_ratio 60 \
  --unlock_date $UNLOCK

# Check bucket state
stellar contract invoke \
  --id $CONTRACT \
  --network testnet \
  --source sender \
  -- get_bucket \
  --receiver $RECEIVER

# Withdraw 5 XLM from spending (always works)
stellar contract invoke \
  --id $CONTRACT \
  --network testnet \
  --source receiver \
  -- withdraw_spending \
  --receiver $RECEIVER \
  --amount 50000000

# Withdraw from goal (fails if locked, works after unlock_date)
stellar contract invoke \
  --id $CONTRACT \
  --network testnet \
  --source receiver \
  -- withdraw_goal \
  --receiver $RECEIVER \
  --amount 50000000
```

---

## 7. Test Accounts (Pre-Configured)

These accounts are already set up on testnet with XLM:

| Role | Address | CLI Identity |
|------|---------|-------------|
| Deployer | `GDFZMTSOG5IYX7G4SWHWS3UBF7C3TXLCJFPKCVYREXAHBYB3L6AGK75E` | `deployer` |
| Test Sender (OFW) | `GDP5DTFLCG3ZSXYGSHCVZXIKKVP6MHDY7Z3EYMYEJOKR2KFPNA7A7YXJ` | `sender` |
| Test Receiver (Family) | `GDXKVV5BGBDRNSJDCZAEX3XMXWD6Z2WBCHBCT55ZFWG6R2RL5MMTZR3Y` | `receiver` |

> **Any new account works too!** Just fund via Friendbot and you can deposit/withdraw immediately.

---

## 8. Deployed Contract Addresses

| Contract | ID |
|----------|------|
| INGAT Vault | `CCQGNVUCCAO6WNBXEHT3ZMPB5L57HZJLBIGPY27VSLJMTLVTZJUUINEQ` |
| Native XLM SAC | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

Verify on Stellar Explorer:
- [Vault Contract](https://stellar.expert/explorer/testnet/contract/CCQGNVUCCAO6WNBXEHT3ZMPB5L57HZJLBIGPY27VSLJMTLVTZJUUINEQ)
- [XLM SAC](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC)

---

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Freighter wallet extension is not installed" | Install Freighter from [freighter.app](https://www.freighter.app/) |
| "Please switch Freighter to Stellar Testnet" | Open Freighter → Settings → Network → Testnet |
| Transaction simulation fails | Check that sender has sufficient XLM balance (need amount + ~1 XLM for fees) |
| Allocation history is empty | History pulls from last 24h of on-chain events. Make a new deposit. |
| "Contract not initialized" | Redeploy: `npm run contract:deploy` |
| Account not found | Fund via Friendbot: `curl "https://friendbot.stellar.org/?addr=YOUR_KEY"` |
| Build fails | Run `npm install` from repo root, ensure Node.js v20+ |
| USD conversion shows $0.00 | CoinGecko API may be rate-limited; will use fallback price (~$0.14) |

---

## 10. Quick Demo Script

For a rapid end-to-end demo in under 5 minutes:

1. **Fund accounts** → Friendbot both sender and receiver addresses
2. **Open the app** → Connect Freighter (Sender account, Testnet)
3. **Create deposit** → 20 XLM, 60/40 split, unlock in 2 minutes
4. **Show confirmation** → Transaction hash visible, links to explorer
5. **Show USD equiv** → All amounts show "≈ $X.XX" from live price feed
6. **Switch to Receiver** → Open incognito, connect Receiver wallet
7. **Show buckets** → Spending: 12 XLM available, Goal: 8 XLM locked with timer
8. **Withdraw spending** → Take 5 XLM, show balance update
9. **Try Goal withdrawal** → Disabled/rejected (locked)
10. **Wait for unlock** → Timer hits zero, Goal bucket shows "Unlocked"
11. **Withdraw Goal** → Take 8 XLM, show balance update
12. **Back to Sender** → Allocation history shows the deposit from on-chain events
