# INGAT — Testnet Deployment Record

**Network:** Stellar Testnet  
**Date:** 2026-07-17 (v2)  
**Stellar CLI:** v27.0.0  
**WASM Hash:** `211fa89cd712ad090ce8507c37c3657266e03d108078809f5511c53f6133b629`

---

## Deployed Contracts

| Contract | ID | Explorer |
|----------|----|---------| 
| INGAT Vault (XLM) | `CDNCRZ3GQTDUD2VIPTRGNM7SZLML27LW3LAYISECDVDEFTTGURSLS7XC` | [View](https://lab.stellar.org/r/testnet/contract/CDNCRZ3GQTDUD2VIPTRGNM7SZLML27LW3LAYISECDVDEFTTGURSLS7XC) |
| Native XLM SAC | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | [View](https://lab.stellar.org/r/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |

> **Previous deployments:** 
> - Vault `CDHP4KWHKFOODLUSR4B4KWFIPXCI3NAUGIBENSISTWZS4TU7O3NGHBKL` (XLM-based, multi-bucket but missing emergency withdrawal + sender goal reclaim)
> - Vault `CCQGNVUCCAO6WNBXEHT3ZMPB5L57HZJLBIGPY27VSLJMTLVTZJUUINEQ` (XLM-based, lacking sender post-maturity goal withdrawal)
> - Vault `CALZQBX7GJIQ6MZC6MIIDEJPDBHPHBDHQTGHSUTOW7A7S7OPS4V4346U` (XLM-based, missing contract functions)
> - Vault `CCIXHEXJULBZSRCB5DOMRFB24F73LVNKEVYNB5SPNFW7HV7EHRGKBHFF` (PHPC-based, deprecated to eliminate trustline requirements)

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

All contract functions tested successfully with native XLM (v2.0.0 — adds Phase 4 Condition Unlock):

1. **deposit** — 20 XLM deposited with 60/40 split ✅
2. **deposit (approval_required=true)** — Deposit with approval-required mode ✅
3. **get_buckets** — Returns correct spending/goal/unlock_date/approval_required ✅
4. **withdraw_spending** — 5 XLM withdrawn from spending bucket ✅
5. **withdraw_goal (locked)** — Rejected with Error #6 (GoalBucketLocked) before unlock ✅
6. **withdraw_goal (unlocked)** — Works after unlock time ✅
7. **withdraw_goal_sender** — Sender can reclaim goal funds after unlock ✅
8. **request_emergency_withdrawal** — Receiver requests early goal access with 48h cooldown ✅
9. **cancel_emergency_withdrawal** — Sender cancels pending emergency request ✅
10. **cancel_emergency_receiver** — Receiver self-cancels emergency request ✅
11. **execute_emergency_withdrawal** — Funds released after cooldown elapses ✅
12. **request_release** — Receiver requests release after unlock_date on approval-required bucket ✅
13. **approve_release** — Sender approves release request, unlocking goal bucket ✅
14. **get_release_request** — Returns pending/approved release request state ✅
15. **Grace period auto-release** — After 7 days without sender response, withdrawal succeeds ✅
16. **No trustline required** — Any funded account can deposit/withdraw immediately ✅

---

## Notes

- XLM uses 7 decimals (Stellar standard). 1 XLM = 10,000,000 stroops.
- Fund any account for free on testnet: `curl "https://friendbot.stellar.org/?addr=YOUR_KEY"`
- The UI shows live USD conversion via CoinGecko API with a 60-second cache.
- Testnet resets periodically — redeployment may be needed. Use `npm run contract:deploy`.
