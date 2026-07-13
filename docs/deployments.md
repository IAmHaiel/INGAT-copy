# INGAT — Testnet Deployment Record

**Network:** Stellar Testnet  
**Date:** 2026-07-13  
**Stellar CLI:** v27.0.0  
**WASM Hash:** `6f70c02fd3f7bb1700b58e31fc27f8c4a7b948136d16a0812ef764e1b90d7e3b`

---

## Deployed Contracts

| Contract | ID | Explorer |
|----------|----|---------| 
| INGAT Vault (XLM) | `CALZQBX7GJIQ6MZC6MIIDEJPDBHPHBDHQTGHSUTOW7A7S7OPS4V4346U` | [View](https://lab.stellar.org/r/testnet/contract/CALZQBX7GJIQ6MZC6MIIDEJPDBHPHBDHQTGHSUTOW7A7S7OPS4V4346U) |
| Native XLM SAC | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | [View](https://lab.stellar.org/r/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |

> **Previous deployment (PHPC-based):** Vault `CCIXHEXJULBZSRCB5DOMRFB24F73LVNKEVYNB5SPNFW7HV7EHRGKBHFF` — deprecated in favor of native XLM to eliminate trustline requirements.

---

## Key Addresses

| Role | Public Key |
|------|-----------|
| Deployer | `GDFZMTSOG5IYX7G4SWHWS3UBF7C3TXLCJFPKCVYREXAHBYB3L6AGK75E` |
| Test Sender (OFW) | `GDP5DTFLCG3ZSXYGSHCVZXIKKVP6MHDY7Z3EYMYEJOKR2KFPNA7A7YXJ` |
| Test Receiver (Family) | `GDXKVV5BGBDRNSJDCZAEX3XMXWD6Z2WBCHBCT55ZFWG6R2RL5MMTZR3Y` |

---

## CLI Identities

These are managed by `stellar keys` (stored in `~/.config/stellar/identity/`):

- `deployer` — Contract deployer
- `sender` — Test OFW account (funded with XLM)
- `receiver` — Test family account (funded with XLM)

---

## Why Native XLM (Not a Stablecoin)?

We switched from PHPC stablecoin to native XLM for these reasons:

1. **Zero friction:** Any Stellar account can hold and send XLM without adding a trustline first.
2. **No minting step:** Accounts are funded instantly via Friendbot on testnet.
3. **Demo-friendly:** Judges and new users can try the app immediately — just connect Freighter.
4. **USD equivalent shown:** The UI displays a live XLM→USD conversion so users see real-world value.

In production, INGAT would use a stablecoin (USDC, PHPC) for value stability, but for the testnet demo, frictionless UX is more important.

---

## Verification Summary

All contract functions tested successfully with native XLM:

1. **deposit** — 20 XLM deposited with 60/40 split ✅
2. **get_bucket** — Returns correct spending (12 XLM), goal (8 XLM), unlock_date ✅
3. **withdraw_spending** — 5 XLM withdrawn from spending bucket ✅
4. **withdraw_goal (locked)** — Rejected with Error #6 (GoalBucketLocked) before unlock ✅
5. **withdraw_goal (unlocked)** — Works after unlock time ✅
6. **No trustline required** — Any funded account can deposit/withdraw immediately ✅

---

## Notes

- XLM uses 7 decimals (Stellar standard). 1 XLM = 10,000,000 stroops.
- Fund any account for free on testnet: `curl "https://friendbot.stellar.org/?addr=YOUR_KEY"`
- The UI shows live USD conversion via CoinGecko API with a 60-second cache.
- Testnet resets periodically — redeployment may be needed. Use `npm run contract:deploy`.
