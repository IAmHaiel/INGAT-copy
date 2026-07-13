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

Your testnet account needs XLM for transaction fees:

1. Copy your Freighter public key (starts with `G...`)
2. Fund it via Friendbot:
   ```bash
   curl "https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY_HERE"
   ```

### Add PHPC Trustline

To receive the PHPC stablecoin, your account needs a trustline:

```bash
# Using Stellar CLI — add trustline to PHPC
stellar contract invoke \
  --id CBUG6YFWHLFO72UDOSWNPFXLFOXMHUQLPVLIRL6VNOSA27VHKXPSMOU6 \
  --network testnet \
  --source YOUR_IDENTITY \
  -- approve \
  --from YOUR_PUBLIC_KEY \
  --spender CCIXHEXJULBZSRCB5DOMRFB24F73LVNKEVYNB5SPNFW7HV7EHRGKBHFF \
  --amount 99999999999 \
  --expiration-ledger 99999999
```

Or set up the trustline via [Stellar Lab](https://lab.stellar.org):
1. Go to Transaction Builder → Select Testnet
2. Add operation: `Change Trust` → Asset Code: `PHPC`, Issuer: `GDFZMTSOG5IYX7G4SWHWS3UBF7C3TXLCJFPKCVYREXAHBYB3L6AGK75E`
3. Sign and submit

### Mint Test PHPC Tokens

If you control the deployer identity, mint PHPC to your sender account:

```bash
stellar contract invoke \
  --id CBUG6YFWHLFO72UDOSWNPFXLFOXMHUQLPVLIRL6VNOSA27VHKXPSMOU6 \
  --network testnet \
  --source deployer \
  -- mint \
  --to YOUR_SENDER_PUBLIC_KEY \
  --amount 10000000000
```

This mints 1000 PHPC (7 decimals: 1000 × 10^7 = 10,000,000,000 stroops).

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
   - **Amount:** e.g., `100` (PHPC)
   - **Split Ratio:** e.g., `60%` spending / `40%` goal
   - **Unlock Date:** A future date (for testing, pick a date 5 minutes from now)
3. Click **"Execute Remittance Split"**
4. Approve the transaction in Freighter
5. Wait for on-chain confirmation → redirected to Transaction Confirmation screen

### View Allocation History

After depositing, return to the Sender Dashboard. The **Allocation History** section shows your deposit pulled from on-chain events, including:
- Receiver address
- Amount
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
- **Spending Bucket** — Available balance, withdraw anytime
- **Goal Bucket** — Locked balance with unlock countdown timer

### Withdraw from Spending Bucket

1. On the Spending Bucket card, enter a withdrawal amount
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
| Deposit with insufficient PHPC balance | Transaction fails on-chain |
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
CONTRACT=CCIXHEXJULBZSRCB5DOMRFB24F73LVNKEVYNB5SPNFW7HV7EHRGKBHFF

# Deposit 100 PHPC with 60/40 split, unlock in 5 minutes
UNLOCK=$(date -d "+5 minutes" +%s)

stellar contract invoke \
  --id $CONTRACT \
  --network testnet \
  --source sender \
  -- deposit \
  --sender $SENDER \
  --receiver $RECEIVER \
  --amount 1000000000 \
  --split_ratio 60 \
  --unlock_date $UNLOCK

# Check bucket state
stellar contract invoke \
  --id $CONTRACT \
  --network testnet \
  --source sender \
  -- get_bucket \
  --receiver $RECEIVER

# Withdraw 20 PHPC from spending (always works)
stellar contract invoke \
  --id $CONTRACT \
  --network testnet \
  --source receiver \
  -- withdraw_spending \
  --receiver $RECEIVER \
  --amount 200000000

# Withdraw from goal (fails if locked, works after unlock_date)
stellar contract invoke \
  --id $CONTRACT \
  --network testnet \
  --source receiver \
  -- withdraw_goal \
  --receiver $RECEIVER \
  --amount 100000000
```

---

## 7. Test Accounts (Pre-Configured)

These accounts are already set up on testnet with PHPC trustlines:

| Role | Address | CLI Identity |
|------|---------|-------------|
| Deployer / PHPC Issuer | `GDFZMTSOG5IYX7G4SWHWS3UBF7C3TXLCJFPKCVYREXAHBYB3L6AGK75E` | `deployer` |
| Test Sender (OFW) | `GDP5DTFLCG3ZSXYGSHCVZXIKKVP6MHDY7Z3EYMYEJOKR2KFPNA7A7YXJ` | `sender` |
| Test Receiver (Family) | `GDXKVV5BGBDRNSJDCZAEX3XMXWD6Z2WBCHBCT55ZFWG6R2RL5MMTZR3Y` | `receiver` |

> **Testnet resets periodically.** If accounts are missing, re-run `npm run contract:deploy` and fund accounts via Friendbot.

---

## 8. Deployed Contract Addresses

| Contract | ID |
|----------|------|
| INGAT Vault | `CCIXHEXJULBZSRCB5DOMRFB24F73LVNKEVYNB5SPNFW7HV7EHRGKBHFF` |
| PHPC Stablecoin (SAC) | `CBUG6YFWHLFO72UDOSWNPFXLFOXMHUQLPVLIRL6VNOSA27VHKXPSMOU6` |

Verify on Stellar Explorer:
- [Vault Contract](https://stellar.expert/explorer/testnet/contract/CCIXHEXJULBZSRCB5DOMRFB24F73LVNKEVYNB5SPNFW7HV7EHRGKBHFF)
- [PHPC Token](https://stellar.expert/explorer/testnet/contract/CBUG6YFWHLFO72UDOSWNPFXLFOXMHUQLPVLIRL6VNOSA27VHKXPSMOU6)

---

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Freighter wallet extension is not installed" | Install Freighter from [freighter.app](https://www.freighter.app/) |
| "Please switch Freighter to Stellar Testnet" | Open Freighter → Settings → Network → Testnet |
| Transaction simulation fails | Check that sender has sufficient PHPC balance and XLM for fees |
| Allocation history is empty | History pulls from last 24h of on-chain events. Make a new deposit. |
| "Contract not initialized" | Redeploy: `npm run contract:deploy` |
| Account not found | Fund via Friendbot: `curl "https://friendbot.stellar.org/?addr=YOUR_KEY"` |
| Build fails | Run `npm install` from repo root, ensure Node.js v20+ |

---

## 10. Quick Demo Script

For a rapid end-to-end demo in under 5 minutes:

1. **Open the app** → Connect Freighter (Sender account, Testnet)
2. **Create deposit** → 100 PHPC, 60/40 split, unlock in 2 minutes
3. **Show confirmation** → Transaction hash visible, links to explorer
4. **Switch to Receiver** → Open incognito, connect Receiver wallet
5. **Show buckets** → Spending: 60 PHPC available, Goal: 40 PHPC locked with timer
6. **Withdraw spending** → Take 20 PHPC, show balance update
7. **Try Goal withdrawal** → Disabled/rejected (locked)
8. **Wait for unlock** → Timer hits zero, Goal bucket shows "Unlocked"
9. **Withdraw Goal** → Take 40 PHPC, show balance update
10. **Back to Sender** → Allocation history shows the deposit from on-chain events
