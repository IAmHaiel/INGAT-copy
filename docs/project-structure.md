# INGAT — Project Structure

```
ingat/
├── .agents/
│   └── skills/
│       ├── soroban-contract-patterns.md
│       ├── nextjs-page-architecture.md
│       ├── freighter-wallet-integration.md
│       └── tailwind-styling-conventions.md
│
├── .kiro/
│   └── steering/
│       ├── product.md
│       ├── tech.md
│       └── structure.md
│
├── .artifacts/
│   ├── plans/
│   │   ├── phase-1-contract-core.md
│   │   ├── phase-2-wallet-sender-flow.md
│   │   ├── phase-3-receiver-flow.md
│   │   └── phase-4-polish-demo.md
│   │
│   └── fixes/
│       └── .gitkeep
│
├── apps/
│   └── web/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx                        # Landing / Connect Wallet
│       │   ├── sender/
│       │   │   ├── page.tsx                    # Sender Dashboard (container)
│       │   │   ├── deposit/
│       │   │   │   └── page.tsx                # New Deposit Form (container)
│       │   │   └── confirmation/
│       │   │       └── page.tsx                # Transaction Confirmation (container)
│       │   └── receiver/
│       │       └── page.tsx                    # Receiver Dashboard (container)
│       │
│       ├── components/
│       │   ├── containers/
│       │   │   ├── LandingContainer.tsx
│       │   │   ├── SenderDashboardContainer.tsx
│       │   │   ├── DepositFormContainer.tsx
│       │   │   ├── TransactionConfirmationContainer.tsx
│       │   │   └── ReceiverDashboardContainer.tsx
│       │   │
│       │   └── ui/
│       │       ├── wallet/
│       │       │   ├── ConnectWalletButton.tsx
│       │       │   └── WalletAddressBadge.tsx
│       │       ├── deposit/
│       │       │   ├── DepositForm.tsx
│       │       │   ├── SplitRatioInput.tsx
│       │       │   └── UnlockDatePicker.tsx
│       │       ├── buckets/
│       │       │   ├── SpendingBucketCard.tsx
│       │       │   └── GoalBucketCard.tsx
│       │       ├── history/
│       │       │   └── AllocationHistoryList.tsx
│       │       └── feedback/
│       │           ├── TransactionStatus.tsx
│       │           ├── ErrorState.tsx
│       │           └── EmptyState.tsx
│       │
│       ├── hooks/
│       │   ├── useWallet.ts
│       │   ├── useDeposit.ts
│       │   ├── useBucketBalances.ts
│       │   ├── useWithdraw.ts
│       │   └── useAllocationHistory.ts
│       │
│       ├── lib/
│       │   ├── stellar/
│       │   │   ├── client.ts                   # Stellar SDK setup
│       │   │   ├── contract.ts                 # Contract call wrappers
│       │   │   └── freighter.ts                # Freighter connect/sign helpers
│       │   ├── validation/
│       │   │   └── deposit.ts                  # Split ratio / date validation
│       │   └── utils/
│       │       └── format.ts
│       │
│       ├── types/
│       │   ├── wallet.ts
│       │   ├── bucket.ts
│       │   └── transaction.ts
│       │
│       ├── styles/
│       │   └── globals.css
│       │
│       ├── public/
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── contracts/
│   └── ingat-vault/
│       ├── src/
│       │   ├── lib.rs
│       │   ├── deposit.rs                      # deposit() logic + split
│       │   ├── withdraw.rs                     # withdraw_spending() / withdraw_goal()
│       │   ├── storage.rs                      # bucket state schema
│       │   └── errors.rs
│       ├── tests/
│       │   └── vault_test.rs
│       ├── Cargo.toml
│       └── Cargo.lock
│
├── README.md
├── LICENSE.md
└── AGENTS.md
```