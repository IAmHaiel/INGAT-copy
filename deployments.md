# INGAT — Testnet Deployment Record

**Network:** Stellar Testnet  
**Date:** 2026-07-13  
**Stellar CLI:** v27.0.0  
**WASM Hash:** `6f70c02fd3f7bb1700b58e31fc27f8c4a7b948136d16a0812ef764e1b90d7e3b`

---

## Deployed Contracts

| Contract | ID | Explorer |
|----------|----|---------| 
| INGAT Vault | `CCIXHEXJULBZSRCB5DOMRFB24F73LVNKEVYNB5SPNFW7HV7EHRGKBHFF` | [View](https://lab.stellar.org/r/testnet/contract/CCIXHEXJULBZSRCB5DOMRFB24F73LVNKEVYNB5SPNFW7HV7EHRGKBHFF) |
| PHPC Stablecoin (SAC) | `CBUG6YFWHLFO72UDOSWNPFXLFOXMHUQLPVLIRL6VNOSA27VHKXPSMOU6` | [View](https://lab.stellar.org/r/testnet/contract/CBUG6YFWHLFO72UDOSWNPFXLFOXMHUQLPVLIRL6VNOSA27VHKXPSMOU6) |

---

## Key Addresses

| Role | Public Key |
|------|-----------|
| Deployer / PHPC Issuer | `GDFZMTSOG5IYX7G4SWHWS3UBF7C3TXLCJFPKCVYREXAHBYB3L6AGK75E` |
| Test Sender (OFW) | `GDP5DTFLCG3ZSXYGSHCVZXIKKVP6MHDY7Z3EYMYEJOKR2KFPNA7A7YXJ` |
| Test Receiver (Family) | `GDXKVV5BGBDRNSJDCZAEX3XMXWD6Z2WBCHBCT55ZFWG6R2RL5MMTZR3Y` |

---

## CLI Identities

These are managed by `stellar keys` (stored in `~/.config/stellar/identity/`):

- `deployer` — Contract deployer and PHPC issuer
- `sender` — Test OFW account (funded, holds PHPC)
- `receiver` — Test family account (funded, has PHPC trustline)

---

## Verification Summary

All contract functions tested successfully on testnet:

1. **deposit** — 100 PHPC deposited with 60/40 split ✅
2. **get_bucket** — Returns correct spending (600M), goal (400M), unlock_date ✅
3. **withdraw_spending** — 20 PHPC withdrawn from spending bucket ✅
4. **withdraw_goal (locked)** — Rejected with Error #6 (GoalBucketLocked) before unlock ✅
5. **withdraw_goal (unlocked)** — 10 PHPC withdrawn after unlock time passed ✅

---

## Notes

- PHPC uses 7 decimals (Stellar standard). 1 PHPC = 10,000,000 stroops.
- The deployer is the PHPC issuer and can mint tokens to any account with a trustline.
- To mint PHPC to a new account: establish trustline first, then call `mint` on the SAC.
- Testnet resets periodically — redeployment may be needed. Use `npm run contract:deploy`.
