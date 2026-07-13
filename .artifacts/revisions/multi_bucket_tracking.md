## Goal Description
Currently, the smart contract aggregates all deposits for a given receiver into a single pair of Spending and Goal balances. The goal of this task is to track each deposit individually so that the receiver can view separate pairs of Spending and Goal bucket cards for every transaction received (even from the same sender). Each pair of cards will also display the sender's details and maintain its own specific goal unlocking time.

## User Review Required
> [!IMPORTANT]
> **State Migration / Reset**: Modifying the smart contract state keys (`DataKey::Bucket`) and the `BucketState` struct will make the existing deployed smart contract incompatible with current stored data. Since this is on the testnet, the contract will need to be rebuilt and redeployed, and the `CONTRACT_ID` in the `.env.local` file updated. All previous testnet data will essentially be reset. 

## Open Questions
> [!NOTE]
> Do we need to update the Supabase transaction log to record the specific `bucket_id` upon withdrawal? Since the smart contract is the source of truth for balances, this is not strictly necessary for the frontend to function, but it could be helpful for future transaction history filtering. The current plan does not modify the Supabase schema.

---

## Proposed Changes

### Smart Contract: Storage & State Management
Currently, deposits are aggregated into one `DataKey::Bucket(Address)`. We will change this to track the number of buckets per receiver and store each bucket separately using an index.

#### [MODIFY] `contracts/ingat-vault/src/storage.rs`
- Update `BucketState` struct to include `pub id: u32` and `pub sender: Address`.
- Modify `DataKey` enum to replace `Bucket(Address)` with `BucketCount(Address)` and `Bucket(Address, u32)`.
- Add `pub fn get_bucket_count` and `pub fn set_bucket_count`.
- Update `get_bucket` and `set_bucket` to take an additional `bucket_id: u32` parameter.

### Smart Contract: Deposit & Withdraw Logic
When a deposit is made, instead of adding to an existing balance, we create a new bucket. Withdrawals must now specify which bucket they target.

#### [MODIFY] `contracts/ingat-vault/src/deposit.rs`
- Modify the `deposit` function to:
  1. Fetch the current `bucket_count` for the receiver.
  2. Create a new `BucketState` with the `id` set to `bucket_count` and the provided `sender`.
  3. Save the new bucket to storage.
  4. Increment and save the `bucket_count`.

#### [MODIFY] `contracts/ingat-vault/src/withdraw.rs`
- Add a `bucket_id: u32` parameter to both `withdraw_spending` and `withdraw_goal`.
- Fetch the specific bucket using `bucket_id` instead of the aggregated bucket.

#### [MODIFY] `contracts/ingat-vault/src/lib.rs`
- Replace `pub fn get_bucket` with `pub fn get_buckets(env: Env, receiver: Address) -> Vec<BucketState>` that iterates over `bucket_count` and returns an array of all buckets for a receiver.
- Update `withdraw_spending` and `withdraw_goal` signatures to expose the `bucket_id` parameter.

---

### Frontend: Types & Stellar Client
The frontend needs to send the `bucket_id` in withdrawal transactions and decode the new array of buckets returned by the contract.

#### [MODIFY] `apps/web/types/bucket.ts`
- Update the `BucketState` interface to include `id: number` and `sender: string`.

#### [MODIFY] `apps/web/lib/stellar/contract.ts`
- Update `fetchBucketBalances` to decode an array of buckets instead of a single object (and possibly rename to `fetchBuckets`).
- Add `bucketIdScVal` to the `buildWithdrawSpendingTx` and `buildWithdrawGoalTx` transaction builders.

### Frontend: Hooks & UI
The dashboard will map over the array of buckets and render a section for each deposit, displaying the sender's details and the two corresponding bucket cards.

#### [MODIFY] `apps/web/hooks/useBucketBalances.ts`
- Change state from a single `BucketState | null` to an array `BucketState[]`.

#### [MODIFY] `apps/web/hooks/useWithdraw.ts`
- Update `withdraw(type, amount)` to `withdraw(bucketId: number, type, amount)`.
- Change `isWithdrawing` from a boolean to `number | null` to track which specific bucket is currently loading, preventing all cards from showing a loading state simultaneously.

#### [MODIFY] `apps/web/components/containers/ReceiverDashboardContainer.tsx`
- Refactor the UI to map over `buckets`. 
- For each `bucket`, render a styled wrapper that displays the sender's address (e.g., "Received from: GXXX...").
- Render `SpendingBucketCard` and `GoalBucketCard` inside the wrapper, passing `bucket.id` to the withdrawal handlers.

---

## Verification Plan

### Automated Tests
```bash
# Run the soroban smart contract unit tests to verify the multi-bucket logic
npm run contract:test
```

### Manual Verification
1. **Redeploy Contract**: Build the contract (`npm run contract:build`), deploy it to the testnet, and update `CONTRACT_ID` in `.env.local`.
2. **Send First Transaction**: As a sender, deposit funds to a receiver. 
3. **Verify Dashboard (Deposit 1)**: Switch to the receiver dashboard and verify that ONE pair of cards appears with the sender's details.
4. **Send Second Transaction**: As the same sender (or a different one), deposit a new amount with a *different* unlock time to the same receiver.
5. **Verify Dashboard (Deposit 2)**: Switch to the receiver dashboard and verify that TWO distinct pairs of cards now appear, each retaining their correct balances and distinct unlock timers.
6. **Withdrawal Check**: Perform a withdrawal from the first deposit's spending card and verify that *only* the balance of that specific card decreases.
