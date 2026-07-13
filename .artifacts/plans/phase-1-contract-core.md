# Phase 1: Contract Core Plan

This phase focuses on the design, coding, testing, and deployment of the `ingat-vault` Soroban smart contract.

## Deliverables
1. **Contract Initialization**: Store contract configuration (e.g. native token/stablecoin contract address).
2. **Deposit & Split Logic**: Add `deposit(sender, receiver, amount, split_ratio, unlock_date)` which accepts stablecoin deposits and transfers the funds into the contract's escrow address.
3. **Internal Accounting**: Update balance mapping for the receiver's address, storing separate values for `spending_balance` and `goal_balance`, as well as `unlock_date`.
4. **Withdrawal Logic**:
   - `withdraw_spending(receiver, amount)`: Deduct from `spending_balance` and transfer stablecoins to `receiver`. Allowed at any time.
   - `withdraw_goal(receiver, amount)`: Deduct from `goal_balance` and transfer stablecoins to `receiver`. Reverts if `ledger.timestamp < unlock_date`.
5. **Testing Suite**: Manual/automated tests in `tests/vault_test.rs` ensuring correct math and timelocking.
6. **Deployment**: Deploy contract to Stellar Testnet and save contract ID.
