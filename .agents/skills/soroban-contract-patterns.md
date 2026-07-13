# Soroban Smart Contract Patterns for INGAT

This guide outlines the smart contract patterns and conventions to be used in the `ingat-vault` contract.

## 1. Storage Types and Lifetime Management
Soroban provides three types of storage:
- **Temporary Storage**: Cheap, but can be deleted if not renewed. Use for transient data.
- **Instance Storage**: Shared state tied to the contract instance. Use for contract configuration and metadata.
- **Persistent Storage**: Retained indefinitely as long as rent is paid. Use for user ledger balances, buckets, and critical security parameters.

For `INGAT`, we use **Persistent Storage** to track user bucket data (Spending Bucket and Goal Bucket) and **Instance Storage** for contract initialization properties if any.

```rust
use soroban_sdk::{Env, Address};

// Example schema for bucket storage
#[contracttype]
pub enum DataKey {
    Bucket(Address), // Receiver Address -> BucketState
}
```

## 2. Event Emission
Always emit events for key contract actions. This allows frontends and indexers to track history without scanning contract state repeatedly.
- `deposit` event: `["deposit", sender, receiver, amount, split_ratio, unlock_date]`
- `withdraw` event: `["withdraw", receiver, amount, bucket_type]`

## 3. Error Handling
Define explicit, typed error enums using `#[contracterror]` to avoid generic transaction failures and provide clear debugging signals to the frontend client.

```rust
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidSplitRatio = 3,
    UnlockDateInPast = 4,
    InsufficientFunds = 5,
    GoalBucketLocked = 6,
}
```

## 4. Contract testing
Maintain high test coverage under `tests/vault_test.rs` to verify:
- Success and failure branches of deposits.
- Timelock enforcement (adjusting ledger times using `env.ledger().set_timestamp(...)`).
- Complete flow from initialization to double-withdrawals.
