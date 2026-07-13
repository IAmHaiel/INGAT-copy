apps/web/
├── app/
│   ├── layout.tsx                              # Root layout — fonts, global providers, <html>/<body>
│   ├── page.tsx                                 # Screen: Landing / Connect Wallet
│   ├── globals.css                              # Tailwind base + global styles
│   │
│   ├── sender/
│   │   ├── page.tsx                             # Screen: Sender Dashboard
│   │   ├── deposit/
│   │   │   └── page.tsx                         # Screen: New Deposit Form
│   │   └── confirmation/
│   │       └── page.tsx                         # Screen: Transaction Confirmation (deposit flow)
│   │
│   └── receiver/
│       ├── page.tsx                             # Screen: Receiver Dashboard
│       └── confirmation/
│           └── page.tsx                         # Screen: Transaction Confirmation (withdraw flow)
│
├── components/
│   ├── containers/                              # One container per page.tsx — owns hooks/state
│   │   ├── LandingContainer.tsx
│   │   ├── SenderDashboardContainer.tsx
│   │   ├── DepositFormContainer.tsx
│   │   ├── TransactionConfirmationContainer.tsx
│   │   └── ReceiverDashboardContainer.tsx
│   │
│   └── ui/                                      # Presentational only — no hooks, no state, props in
│       ├── wallet/
│       │   ├── ConnectWalletButton.tsx
│       │   └── WalletAddressBadge.tsx
│       │
│       ├── dashboard/
│       │   ├── SummaryCard.tsx                  # Total Sent / Active Locks / Next Unlock
│       │   └── StatusPill.tsx                   # Locked (terracotta) / Unlocked (sage)
│       │
│       ├── deposit/
│       │   ├── DepositForm.tsx
│       │   ├── AmountInput.tsx
│       │   ├── SplitRatioInput.tsx
│       │   ├── SplitRatioBar.tsx                # visual teal/amber proportional bar
│       │   ├── UnlockDatePicker.tsx
│       │   └── ReceiverAddressInput.tsx
│       │
│       ├── buckets/
│       │   ├── SpendingBucketCard.tsx
│       │   └── GoalBucketCard.tsx
│       │
│       ├── history/
│       │   ├── AllocationHistoryList.tsx
│       │   └── AllocationHistoryRow.tsx
│       │
│       └── feedback/
│           ├── TransactionSuccess.tsx
│           ├── TransactionPending.tsx
│           ├── TransactionError.tsx
│           ├── ErrorBanner.tsx
│           └── EmptyState.tsx
│
├── hooks/
│   ├── useWallet.ts                             # connect/disconnect, current address, network check
│   ├── useDeposit.ts                            # submit deposit tx, loading/error state
│   ├── useWithdraw.ts                           # submit withdraw tx, loading/error state
│   ├── useBucketBalances.ts                     # fetch spending/goal balances for a receiver
│   └── useAllocationHistory.ts                  # fetch deposit history for a sender
│
├── lib/
│   ├── stellar/
│   │   ├── client.ts                            # Stellar SDK / RPC client setup
│   │   ├── contract.ts                          # typed wrappers around contract calls
│   │   └── freighter.ts                         # Freighter connect/sign helpers
│   │
│   ├── validation/
│   │   └── deposit.ts                           # split ratio sums to 100, unlock date is future
│   │
│   └── utils/
│       ├── format.ts                            # currency, date, address truncation
│       └── constants.ts                         # contract ID, network passphrase, RPC url
│
├── types/
│   ├── wallet.ts
│   ├── bucket.ts
│   └── transaction.ts
│
├── public/
│   └── (static assets — logo, illustrations)
│
├── .env.local                                   # NEXT_PUBLIC_CONTRACT_ID, NEXT_PUBLIC_RPC_URL, etc.
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
└── package.json