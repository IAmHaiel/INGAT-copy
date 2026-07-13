# VibeSec Security Audit Plan — INGAT

> **Scope:** Full-stack audit of the INGAT remittance dApp  
> **Methodology:** [vibe-sec.md](file:///home/friedrich/workspace/hackathon/ingat/.agents/skills/vibe-sec.md) secure coding guide applied to actual codebase  
> **Date:** 2026-07-13  

---

## Executive Summary

INGAT is a **client-side dApp** (Next.js 16 + Soroban smart contract) with **no backend server**. This fundamentally changes which VibeSec categories apply. The smart contract is the sole authority; all state-changing operations require Freighter wallet signatures. There is no server-side API, no database, no file uploads, and no user-provided URLs processed server-side.

**Overall posture:** The on-chain contract has solid fundamentals (`require_auth`, initialization guard, input validation). The primary risks are in the **frontend trust boundary** and **missing defense-in-depth** hardening.

---

## Applicability Matrix

| VibeSec Category | Applies? | Rationale |
|:--|:--|:--|
| Access Control / Authorization | ✅ **Partial** | Contract enforces `require_auth`; no backend to bypass, but frontend has no role gating |
| XSS | ✅ **Yes** | React provides baseline escaping, but CSP headers are absent |
| CSRF | ⬜ **N/A** | No backend endpoints; all state changes are wallet-signed chain txns |
| Secret Keys / Sensitive Data | ✅ **Yes** | `NEXT_PUBLIC_*` env vars, `.env.local` handling |
| Open Redirect | ⬜ **N/A** | No URL-based redirects in the app |
| Password Security | ⬜ **N/A** | No passwords; wallet-based auth only |
| SSRF | ⬜ **N/A** | No server-side URL fetching |
| File Upload | ⬜ **N/A** | No file upload functionality |
| SQL Injection | ⬜ **N/A** | No database |
| XXE | ⬜ **N/A** | No XML processing |
| Path Traversal | ⬜ **N/A** | No server-side file access from user input |
| Security Headers | ✅ **Yes** | Next.js config has zero security headers |
| JWT Security | ⬜ **N/A** | No JWT; wallet signatures are the auth mechanism |
| Mass Assignment / API Security | ⬜ **N/A** | No REST/GraphQL API |

---

## Findings

### 🔴 Critical

#### C-1: No Network Verification Before Transaction Signing

| | |
|:--|:--|
| **Location** | [freighter.ts:28](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/stellar/freighter.ts#L26-L33) |
| **Issue** | `signTxWithFreighter` hardcodes the Testnet passphrase but never verifies the user's Freighter is actually connected to Testnet. If a user's wallet is on Mainnet, the signed transaction will fail silently or, worse, could execute against the wrong network. |
| **VibeSec Rule** | Defense in depth — never rely on a single control |
| **Fix** | Call `getFreighterNetwork()` before every `signTransaction()` and compare `networkPassphrase` to the app's expected value. Reject mismatches with a clear error. |

```diff
 // freighter.ts — signTxWithFreighter
+  const networkDetails = await getFreighterNetwork();
+  if (!networkDetails || networkDetails.networkPassphrase !== 'Test SDF Network ; September 2015') {
+    throw new Error('Freighter is not connected to Stellar Testnet. Please switch networks.');
+  }
   const result = await signTransaction(xdr, { networkPassphrase: 'Test Stellar Network ; September 2015' });
```

> [!CAUTION]
> There's also a **passphrase string mismatch** between `freighter.ts` ("Test Stellar Network ; September 2015") and `constants.ts` ("Test SDF Network ; September 2015"). Only one is correct. Stellar Testnet uses `"Test SDF Network ; September 2015"`. The passphrase in `freighter.ts` line 28 appears wrong and should be `"Test SDF Network ; September 2015"` (matching `Networks.TESTNET` from the SDK, which `client.ts` already uses correctly).

---

#### C-2: Smart Contract Missing `sender ≠ receiver` Validation

| | |
|:--|:--|
| **Location** | [deposit.rs:5-67](file:///home/friedrich/workspace/hackathon/ingat/contracts/ingat-vault/src/deposit.rs#L5-L67) |
| **Issue** | A sender can deposit to themselves as receiver. This bypasses the intended OFW→family remittance model. A self-deposit to the goal bucket with a far-future unlock date effectively **locks the sender's own funds** with no recovery mechanism. There is no `cancel_deposit` or admin override. |
| **VibeSec Rule** | Fail securely — unrecoverable fund lockup is a critical design flaw |
| **Fix** | Add `if sender == receiver { return Err(Error::SelfDeposit); }` after `require_auth`. Also consider adding a maximum unlock duration (e.g., 2 years). |

---

### 🟠 High

#### H-1: Missing Security Headers in Next.js Config

| | |
|:--|:--|
| **Location** | [next.config.ts](file:///home/friedrich/workspace/hackathon/ingat/apps/web/next.config.ts) |
| **Issue** | The config is empty — no security headers at all. Missing: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`. |
| **VibeSec Rule** | Security Headers Checklist — all listed headers should be present |
| **Fix** | Add `headers()` to `next.config.ts`: |

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Required for Next.js dev; tighten with nonces in prod
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://soroban-testnet.stellar.org https://horizon-testnet.stellar.org",
              "img-src 'self' data:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

---

#### H-2: localStorage Used as Trusted Data Source (Tamperable History)

| | |
|:--|:--|
| **Location** | [useDeposit.ts:57-60](file:///home/friedrich/workspace/hackathon/ingat/apps/web/hooks/useDeposit.ts#L57-L60), [useAllocationHistory.ts:15-17](file:///home/friedrich/workspace/hackathon/ingat/apps/web/hooks/useAllocationHistory.ts#L15-L17) |
| **Issue** | Allocation history is stored in `localStorage` and read back with `JSON.parse()` without any validation. A user (or XSS payload) can inject arbitrary allocation records. The history is also displayed in the Sender Dashboard without sanitization of the parsed data. |
| **VibeSec Rule** | Input validation — LocalStorage values must be validated if rendered |
| **Fix** | (1) Add a runtime type-check / schema validation (e.g., Zod) when parsing localStorage data. (2) Add a disclaimer that history is client-side only. (3) Long-term: read allocation events from Stellar Horizon to get verifiable on-chain history. |

---

#### H-3: Smart Contract Has No Instance TTL Extension

| | |
|:--|:--|
| **Location** | [storage.rs](file:///home/friedrich/workspace/hackathon/ingat/contracts/ingat-vault/src/storage.rs) |
| **Issue** | Bucket (persistent) storage extends TTL on every read/write, but **instance storage** (which holds `Initialized` and `Token` keys) has no TTL extension. If the contract instance expires, the entire vault becomes non-functional — all funds locked. |
| **VibeSec Rule** | Fail securely — fund loss via storage expiry is catastrophic |
| **Fix** | Add `env.storage().instance().extend_ttl(50000, 50000)` in `deposit`, `withdraw_spending`, and `withdraw_goal` to keep the instance alive as long as the contract is in use. |

---

### 🟡 Medium

#### M-1: No Input Sanitization on `console.error` Output

| | |
|:--|:--|
| **Location** | Multiple files: [contract.ts:48](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/stellar/contract.ts#L47-L49), [freighter.ts:21](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/stellar/freighter.ts#L20-L23), hooks |
| **Issue** | Raw error objects from Stellar SDK/Freighter are logged to `console.error`. While not a direct vulnerability in production, in development these can leak internal RPC URLs, contract IDs, and XDR payloads to anyone with DevTools access. Error messages are also displayed to users in some UI components. |
| **VibeSec Rule** | Handle errors securely — don't leak internal details |
| **Fix** | Wrap error messages before displaying to users. Log full errors only in development. Strip Stellar SDK internals from user-facing error strings. |

---

#### M-2: `NEXT_PUBLIC_*` Environment Variables Expose Contract IDs

| | |
|:--|:--|
| **Location** | [client.ts](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/stellar/client.ts), [.env.local](file:///home/friedrich/workspace/hackathon/ingat/apps/web/.env.local) |
| **Issue** | Contract IDs and RPC URLs are exposed client-side via `NEXT_PUBLIC_*`. This is **by design** for a dApp (these are public blockchain addresses), but the `.env.local` file is redundantly gitignored in two places and the `.env.example` exists. Ensure no future developer accidentally adds a private key to this file pattern. |
| **VibeSec Rule** | Secret Keys — environment variables exposed via build tools |
| **Status** | **Low actual risk** — contract IDs are public. But add a comment in `.env.example` explicitly stating: "All values here are PUBLIC blockchain addresses. Never add private keys or secret seeds to this file." |

---

#### M-3: Deposit Validation Inconsistency Between Frontend and Contract

| | |
|:--|:--|
| **Location** | [deposit.ts (validation)](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/validation/deposit.ts#L25-L28) vs [deposit.rs](file:///home/friedrich/workspace/hackathon/ingat/contracts/ingat-vault/src/deposit.rs#L23-L25) |
| **Issue** | Frontend `validateDeposit` allows `splitRatio` of 0 and 100 (range: 0–100). The legacy `validateSplitRatio` requires 1–99. The contract allows 0–100. A split of 0% means **all funds go to the goal bucket** (fully locked), and 100% means **nothing goes to the goal bucket**. Both edge cases should be intentional, not accidental. |
| **VibeSec Rule** | Input validation — validate everything server-side (contract-side here) |
| **Fix** | Decide on a policy: if 0% and 100% splits are valid business logic, document it. If not, tighten the contract to `1..=99`. Either way, align frontend and contract validation ranges. |

---

#### M-4: No Maximum Deposit Amount Check

| | |
|:--|:--|
| **Location** | [deposit.rs:19-21](file:///home/friedrich/workspace/hackathon/ingat/contracts/ingat-vault/src/deposit.rs#L19-L21) |
| **Issue** | The contract only checks `amount > 0` but has no upper bound. While the token transfer would fail if the sender lacks funds, there's no protection against integer overflow in the split calculation: `(amount * split_ratio as i128) / 100`. For astronomically large `i128` values, `amount * 100` could theoretically overflow. |
| **VibeSec Rule** | Input validation — validate data types and ranges |
| **Fix** | Add a reasonable max amount check or use `checked_mul` for the split calculation. |

---

### 🔵 Low

#### L-1: Receiver Address Validation Regex Mismatch

| | |
|:--|:--|
| **Location** | [deposit.ts (validation)](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/validation/deposit.ts#L14) vs [deposit.ts:81-92](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/validation/deposit.ts#L81-L92) |
| **Issue** | Two validation functions coexist with different strictness levels. `validateDeposit` uses regex `/^G[A-Z2-7]{55}$/` (proper base32 check). `validateReceiverAddress` only checks `startsWith('G') && length === 56` (allows invalid characters). Both are exported; a developer could use the weaker one. |
| **Fix** | Deprecate or remove `validateReceiverAddress`. Use the regex-based validation consistently. |

---

#### L-2: Demo Data Seeded into localStorage

| | |
|:--|:--|
| **Location** | [useAllocationHistory.ts:19-39](file:///home/friedrich/workspace/hackathon/ingat/apps/web/hooks/useAllocationHistory.ts#L19-L39) |
| **Issue** | When no history exists, fake demo data with a hardcoded Stellar address is written to localStorage. This could confuse users into thinking real transactions occurred. It also contains a hardcoded address (`GDQP237HW...`) that could be mistaken for a real receiver. |
| **Fix** | Guard demo data behind a `NODE_ENV === 'development'` check or remove it entirely for production builds. |

---

#### L-3: No Transaction Fee Estimation for Users

| | |
|:--|:--|
| **Location** | [contract.ts:69-70](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/stellar/contract.ts#L69-L70) |
| **Issue** | Transaction fee is hardcoded at `'100'` stroops. While this is fine for testnet, on mainnet during congestion this could cause transaction failures. Users are not shown the fee before signing. |
| **Fix** | Use the fee from simulation result or provide a fee buffer. Display estimated fees in the confirmation UI. |

---

### ℹ️ Informational

#### I-1: Network Passphrase String Inconsistency

| | |
|:--|:--|
| **Location** | [constants.ts:7](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/utils/constants.ts#L6-L8) vs [client.ts:4](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/stellar/client.ts#L4) vs [freighter.ts:28](file:///home/friedrich/workspace/hackathon/ingat/apps/web/lib/stellar/freighter.ts#L28) |
| **Issue** | Three different passphrase definitions exist: `Networks.TESTNET` (SDK constant, correct), a hardcoded string in `constants.ts`, and a different hardcoded string in `freighter.ts`. The `freighter.ts` string says "Test **Stellar** Network" while the correct value is "Test **SDF** Network". |
| **Fix** | Use `Networks.TESTNET` from `@stellar/stellar-sdk` everywhere. Remove all hardcoded passphrase strings. Single source of truth in `client.ts`. |

---

## Implementation Priority

| Priority | Finding | Effort | Impact |
|:--|:--|:--|:--|
| 1 | **C-1** Network verification + passphrase fix | Small | Prevents wrong-network transactions |
| 2 | **H-3** Instance TTL extension | Small | Prevents catastrophic fund lockup |
| 3 | **H-1** Security headers | Small | Broad defense-in-depth |
| 4 | **C-2** Self-deposit guard | Small | Prevents unrecoverable fund lockup |
| 5 | **I-1** Passphrase consolidation | Small | Eliminates subtle signing bugs |
| 6 | **M-3** Split ratio alignment | Small | Prevents edge-case confusion |
| 7 | **M-4** Overflow-safe split math | Small | Prevents arithmetic edge case |
| 8 | **H-2** localStorage validation | Medium | Prevents data injection |
| 9 | **M-1** Error sanitization | Medium | Reduces info leakage |
| 10 | **L-1** Validation consolidation | Small | Code hygiene |
| 11 | **L-2** Demo data guard | Small | UX clarity |
| 12 | **M-2** Env file comment | Small | Developer safety |
| 13 | **L-3** Fee estimation | Medium | UX improvement |

---

## Out-of-Scope Notes

The following VibeSec categories were evaluated and confirmed **not applicable** to this architecture:

- **CSRF/SSRF/SQL Injection/XXE/Path Traversal** — No backend server exists. All state changes go through wallet-signed Soroban transactions.
- **Password Security / JWT** — Authentication is entirely via Freighter wallet signatures.
- **File Upload** — No file upload features.
- **Mass Assignment / GraphQL** — No API layer.
- **Open Redirect** — No URL redirect handling.

> [!IMPORTANT]
> If a backend is ever added (e.g., for caching, indexing, or notifications), this entire audit must be revisited. The current "no-server" architecture is a significant security advantage.
