# Phase 3: Receiver Flow Plan

This phase builds the Receiver interface and withdrawal capabilities.

## Deliverables
1. **Receiver Dashboard UI**:
   - Welcome/header for connected Receiver address.
   - Distinct cards for the Spending Bucket and the Goal Bucket.
2. **Balance Fetching**:
   - Query contract state for the connected address to fetch `spending_balance`, `goal_balance`, and `unlock_date`.
3. **Spending Bucket Withdrawal**:
   - Inline "Withdraw" action button.
   - Modal/form to enter amount.
   - On submission, signs and triggers `withdraw_spending` on-chain.
4. **Goal Bucket Withdrawal**:
   - Inline "Withdraw" action button.
   - Disabled state with tooltip showing remaining lock time if `current_time < unlock_date`.
   - Enabled state if `current_time >= unlock_date`.
   - On submission, signs and triggers `withdraw_goal` on-chain.
5. **Real-time Balance Refresh**:
   - Trigger state refetch after a successful withdrawal transaction.
