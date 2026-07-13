# Phase 2: Wallet & Sender Flow Plan

This phase connects the Freighter wallet and builds the Sender interface.

## Deliverables
1. **Freighter Wallet Integration**: Connect Freighter and query active account. Switch to Stellar Testnet if needed.
2. **Sender Dashboard UI**:
   - Welcome/landing page.
   - Display wallet address.
   - Show Sender Dashboard containing the New Deposit Form and Allocation History.
3. **New Deposit Form**:
   - Inputs: Receiver Stellar Address, Deposit Amount (USD/Stablecoin), Split Ratio (Percentage for Spending vs Goal), Unlock Date.
   - Validations:
     - Split ratio must sum to 100%.
     - Target address must be a valid Stellar address.
     - Unlock date must be in the future.
4. **Transaction Confirmation**:
   - Construct Soroban transaction envelope using `@stellar/stellar-sdk`.
   - Prompt user to sign using Freighter.
   - Show pending transaction spinner, transaction hash on success, and clear error banner on failure.
5. **Allocation History**:
   - List past deposits by retrieving events or account bucket state from the blockchain.
