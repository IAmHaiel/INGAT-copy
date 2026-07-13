# INGAT — Stellar/Soroban Split-Remittance Protocol

[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-blue?logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban Smart Contract](https://img.shields.io/badge/Smart%20Contract-Soroban-purple)](https://soroban.stellar.org)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Rust](https://img.shields.io/badge/Rust-2021-orange?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE.md)
[![Network: Testnet](https://img.shields.io/badge/Network-Stellar%20Testnet-yellow)](https://soroban-testnet.stellar.org)

---

**INGAT** ("Take care" in Filipino, as in *"Ingat sa biyahe, ingat din sa padala"*) is a decentralized split-remittance protocol built on Stellar and Soroban. It empowers Overseas Filipino Workers (OFWs) to send remittances with programmable on-chain constraints — automatically dividing funds between immediately spendable cash and locked savings goals to prevent impulse spending and ensure financial resilience.

---

## How It Works

```mermaid
sequenceDiagram
    participant S as Sender (OFW)
    participant C as INGAT Contract
    participant R as Receiver (Family)

    S->>C: deposit(amount, splitRatio, unlockDate, receiver)
    C->>C: Split into Spending & Goal buckets
    C-->>R: Spending bucket available immediately
    C-->>R: Goal bucket locked until unlockDate

    R->>C: withdraw_spending(amount)
    C-->>R: ✅ Funds released

    R->>C: withdraw_goal(amount)
    alt Before unlock date
        C--xR: ❌ Rejected — still locked
    else After unlock date
        C-->>R: ✅ Goal funds released
    end
```

---

## Architecture

```mermaid
graph TB
    subgraph Frontend["Web App (Next.js 16)"]
        direction TB
        Pages[App Router Pages]
        Containers[Container Components]
        UI[UI Components]
        Hooks[React Hooks]
        Lib[Stellar Lib Layer]
        Pages --> Containers
        Containers --> UI
        Containers --> Hooks
        Hooks --> Lib
    end

    subgraph Wallet["Browser"]
        Freighter[Freighter Extension]
    end

    subgraph Blockchain["Stellar Network"]
        SorobanRPC[Soroban RPC]
        Contract[INGAT Vault Contract]
        Ledger[(On-Chain State)]
        SorobanRPC --> Contract
        Contract --> Ledger
    end

    Lib <-->|Sign Tx| Freighter
    Lib <-->|Simulate & Submit| SorobanRPC
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| 🔀 **On-Chain Splits** | Instantly partition deposits into Spending & Goal buckets by user-defined percentages |
| 🔒 **Goal Lock Protection** | Lock the Goal bucket on-chain until the sender-specified release date |
| 👛 **Freighter Integration** | Seamless wallet connect and transaction signing via Freighter extension |
| 🎨 **Glassmorphic Dashboard** | Responsive, warm-toned UI built with Manrope font and modern design |
| ⚡ **Soroban Smart Contract** | Gas-efficient Rust contract with state leases, TTL extensions, and 7-decimal precision |

---

## Project Structure

```mermaid
graph LR
    subgraph Root["ingat/"]
        subgraph Apps["apps/web/"]
            A1[app/ — Routes]
            A2[components/ — UI + Containers]
            A3[hooks/ — React Hooks]
            A4[lib/ — Stellar SDK + Validation]
            A5[types/ — TypeScript Interfaces]
        end
        subgraph Contracts["contracts/ingat-vault/"]
            C1[src/ — Contract Logic]
            C2[tests/ — Ledger Tests]
        end
        subgraph Config["Configuration"]
            D1[.agents/skills/]
            D2[.kiro/steering/]
            D3[.artifacts/plans/]
        end
    end
```

```
ingat/
├── apps/web/                   # Next.js 16 App Router Frontend
│   ├── app/                    # Route entries (landing, sender, receiver)
│   ├── components/             # Containers (stateful) + UI (presentational)
│   ├── hooks/                  # Freighter & Soroban React hooks
│   ├── lib/                    # Stellar client, Freighter wrappers, validation
│   ├── context/                # WalletContext provider
│   └── types/                  # TypeScript interface models
├── contracts/ingat-vault/      # Soroban Smart Contract (Rust)
│   ├── src/                    # Vault split & withdraw logic
│   └── tests/                  # Time-manipulated simulated ledger tests
├── .agents/                    # AI agent skill documentation
├── .kiro/                      # Steering docs (product, tech, structure)
└── .artifacts/                 # Engineering plans & bug fix logs
```

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Rust & Cargo](https://rustup.rs/) | Edition 2021 | Smart contract compilation |
| [Node.js](https://nodejs.org/) | v20+ | Frontend development |
| [Freighter Wallet](https://www.freighter.app/) | Latest | Browser wallet extension |

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ingat.git
cd ingat

# Install workspace dependencies (from root)
npm install
```

---

## Development

### Smart Contract (`contracts/ingat-vault`)

```bash
# Run unit tests (time-manipulation, split logic, TTL extensions)
npm run contract:test

# Build optimized WASM
npm run contract:build

# Clean build artifacts
npm run contract:clean
```

### Web Frontend (`apps/web`)

```bash
# Start development server (Turbopack)
npm run dev

# Production build with TypeScript validation
npm run build

# Lint check
npm run lint
```

> ⚠️ Run all commands from the **repo root**. This is an npm workspace — do not `cd apps/web`.

---

## User Flows

```mermaid
flowchart LR
    subgraph Sender Flow
        S1[Connect Wallet] --> S2[Create Deposit]
        S2 --> S3[Set Split Ratio]
        S3 --> S4[Set Unlock Date]
        S4 --> S5[Sign & Submit Tx]
        S5 --> S6[View Confirmation]
    end

    subgraph Receiver Flow
        R1[Connect Wallet] --> R2[View Buckets]
        R2 --> R3{Bucket Type?}
        R3 -->|Spending| R4[Withdraw Anytime]
        R3 -->|Goal| R5{Lock Expired?}
        R5 -->|Yes| R6[Withdraw Goal]
        R5 -->|No| R7[Wait for Unlock]
    end
```

---

## Tech Stack

```mermaid
graph LR
    subgraph Smart Contract
        Rust --> Soroban_SDK
        Soroban_SDK --> WASM[WASM Binary]
    end

    subgraph Frontend
        Next.js --> React_19[React 19]
        React_19 --> TypeScript
        Next.js --> Tailwind_v4[Tailwind CSS v4]
    end

    subgraph Integration
        Stellar_SDK["@stellar/stellar-sdk"] --> Soroban_RPC
        Freighter_API["@stellar/freighter-api"] --> Wallet_Signing[Wallet Signing]
    end

    WASM --> Soroban_RPC[Soroban RPC Testnet]
    Frontend --> Integration
```

---

## Engineering Phases

| Phase | Description | Status |
|:-----:|-------------|:------:|
| 1 | Contract Core — Soroban logic, Cargo workspace, unit tests | ✅ |
| 2 | Wallet & Sender Flow — connection, hooks, deposit form | ✅ |
| 3 | Receiver Flow — bucket cards, unlock timers, withdrawals | ✅ |
| 4 | Polish & Demo — type checks, build validation, clean layouts | ✅ |

---

## Design Principles

- **No Backend** — Contract state is the single source of truth. No databases.
- **Two Roles Only** — Sender and Receiver. No admin/approver/auditor.
- **Warm & Trustworthy** — Banking-app clarity, not crypto-trading neon. Filipino identity in color palette.
- **7-Decimal Precision** — All Stellar amounts handled with full stroops precision.
- **Testnet First** — All development targets Stellar Testnet exclusively.

---

## Contributing

See [AGENTS.md](./AGENTS.md) for architecture conventions, coding rules, and the agent steering system.

---

## License

This project is licensed under the MIT License — see [LICENSE.md](./LICENSE.md) for details.
