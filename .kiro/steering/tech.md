# Technical Stack — INGAT

## Smart Contract
- **Platform**: Soroban (Stellar Smart Contracts).
- **Language**: Rust.
- **Testing**: Native Soroban SDK testing framework.
- **Network**: Stellar Testnet.

## Web Application
- **Framework**: Next.js App Router (React + TypeScript).
- **Wallet Connection**: Freighter extension via `@stellar/freighter-api`.
- **Stellar Network Calls**: `@stellar/stellar-sdk` for parsing, assembling, and submitting transaction envelopes.
- **Transaction Persistence**: Supabase (PostgreSQL) via `@supabase/supabase-js`. Anon key + RLS policies for security.
- **Styling**: Tailwind CSS with custom HSL palette configured to represent the warm Filipino identity.
