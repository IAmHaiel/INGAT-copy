# Next.js Page Architecture for INGAT

This document describes the structure of Next.js App Router files in INGAT.

## Container-Component Pattern
To maximize reusability, testability, and separation of concerns, we separate routing, state container, and UI representation.

1. **Page Routes (`app/**/page.tsx`)**
   - Extremely lightweight.
   - Act as entry points that import the corresponding container.
   - Example:
     ```tsx
     import SenderDashboardContainer from "@/components/containers/SenderDashboardContainer";
     
     export default function SenderDashboardPage() {
       return <SenderDashboardContainer />;
     }
     ```

2. **Containers (`components/containers/*`)**
   - Manage React state, hook integrations, wallet state, and blockchain interaction lifecycle.
   - Coordinate loading, error, and empty states.
   - Pass functions and state variables to presentation components as props.

3. **UI / Presentation Components (`components/ui/*`)**
   - Stateless or purely interactive (e.g. inputs, calendars).
   - Styled using Tailwind CSS.
   - Receive handlers and data via props.

## Directory Map
- `components/ui/wallet/`: Wallet-related indicators and buttons.
- `components/ui/deposit/`: Split ratios, unlock dates, and deposit action trigger.
- `components/ui/buckets/`: Balance display cards for Spending and Goal buckets.
- `components/ui/history/`: List of allocations sent on-chain.
- `components/ui/feedback/`: Empty/error/success states.
