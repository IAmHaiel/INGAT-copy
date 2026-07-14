# Implementation Plan: Receiver Address Safety Check

## 1. Problem Statement & Motivation
The Receiver's Account Address field in the New Deposit Form is the most critical and highest-risk input in the INGAT application. A single typo or a copy-paste of a malicious "typosquat" address can lead to an unrecoverable loss of funds on the Stellar network.

To mitigate this risk without adding friction to the user experience, this module introduces three deterministic, client-side safety checks:
1. **Malformed Address Detection**: Ensures the address is a valid Stellar Ed25519 public key. This prevents users from accidentally pasting an Ethereum address, a truncated key, or random text.
2. **First-Time Address Warning**: Alerts the sender if they are depositing to an address they have never used before. This serves as a gentle reminder to double-check the recipient before committing funds.
3. **Near-Miss Typo Detection**: Calculates the Levenshtein distance against known past addresses. If the input is just 1 or 2 characters off from a known address, it strongly indicates either a fat-finger typo or a clipboard manipulation attack. This requires a hard block/confirmation.

## 2. Proposed Architecture & New Files

Following the Next.js App Router conventions established in the repository:

- **`apps/web/lib/utils/levenshtein.ts`**
  - **Responsibility**: Expose a purely functional `getLevenshteinDistance(a: string, b: string): number` utility.

- **`apps/web/hooks/useKnownAddresses.ts`**
  - **Responsibility**: A React hook that queries the existing Supabase transactions table for all distinct `receiver_address` values associated with the connected `sender_address`. Returns `string[]` of known addresses.

- **`apps/web/lib/validation/addressSafety.ts`**
  - **Responsibility**: Combine the three checks into a single utility that returns a specific safety state enum/type. It will use `@stellar/stellar-sdk`'s `StrKey.isValidEd25519PublicKey()` for the malformed check, and the `levenshtein` utility for the near-miss check.

- **`apps/web/components/ui/deposit/AddressSafetyWarning.tsx`**
  - **Responsibility**: A presentational component that receives the safety state (valid, first-time, near-miss) and conditionally renders the appropriate inline warning or blocking UI below the address input field.

## 3. Integration into Existing Flow

**Where it hooks in:**
- The logic will be orchestrated within the `DepositFormContainer.tsx` (or inside the `DepositForm.tsx` state, depending on where the `useKnownAddresses` hook is mounted). It is best mounted in `DepositFormContainer` and passed down, keeping the form presentational.
- **On Blur**: When the user clicks away from the Receiver Address input, the validation sequence runs immediately:
  1. Check `StrKey.isValidEd25519PublicKey`.
  2. If valid, check against `knownAddresses`.
  3. Determine if it's a first-time address or a near-miss.
- **On Submit**: The form submission is strictly blocked if the state is "near-miss" and the user has not explicitly bypassed the confirmation step.

## 4. UI States & User Interaction

- **State 1: Valid (Known Address)**
  - **UI**: Standard input state (maybe a subtle green checkmark).
  - **Interaction**: Sender can proceed normally without friction.
  
- **State 2: First-Time Address**
  - **UI**: A non-blocking inline warning (e.g., yellow banner or icon) below the input: *"You have not sent funds to this address before. Please verify it is correct."*
  - **Interaction**: Sender does not need to click anything to proceed; it is strictly informational.

- **State 3: Near-Miss (Distance 1 or 2)**
  - **UI**: A critical, blocking warning box (red border). *"Warning: This address is extremely similar to a past recipient, but has a slight difference. This could be a typo or a malicious address."*
  - **Interaction**: The main "Execute Remittance" button becomes disabled. The user must either correct the typo, OR if intentional, check a box or type "CONFIRM" in a small nested input to unlock the submit button.

## 5. Acceptance Criteria

- [ ] Typing an invalid Stellar address format immediately shows a standard validation error on blur, blocking submission.
- [ ] Entering a valid Stellar address that does not exist in the sender's Supabase history displays a non-blocking "First-Time" warning.
- [ ] Entering a valid Stellar address that has a Levenshtein distance of 1 or 2 from a known address displays a blocking "Near-Miss" error.
- [ ] The "Near-Miss" error prevents form submission until explicitly confirmed/bypassed by the user.
- [ ] Entering a valid Stellar address that exactly matches a known address displays no warnings.
- [ ] The feature introduces no new database tables or schema migrations.

## 6. Open Questions & Assumptions

1. **Supabase Query Indexing**: I am assuming the existing `transactions` table can quickly filter by `sender_address` and extract distinct `receiver_address`es. Are there enough rows where a `SELECT DISTINCT` would cause performance issues for the user?
2. **First-Time vs. Near-Miss Precedence**: If an address is a near-miss, it is inherently also a first-time address. I am assuming the Near-Miss check takes absolute precedence and suppresses the generic first-time warning.
3. **Removal of Natural-Language Assistant**: The prompt requested to remove the AI Deposit Assistant. Should I remove those files (`DepositAssistant.tsx`, `/api/assistant/deposit`) when implementation begins, or just leave them unused?
4. **Bypass Mechanism**: For the near-miss check, is a simple checkbox ("I confirm this address is correct") sufficient, or do we want a strict "Type CONFIRM" input constraint?
