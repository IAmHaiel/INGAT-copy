# UI Revamp Implementation Plan

This document outlines the strategy for updating the user interface of the INGAT web application, adhering to the design specifications in `.design-ref` and focusing strictly on presentation (no complex new on-chain functionality).

## 1. Landing Page (`LandingContainer.tsx`)

The landing page will be refactored into distinct, highly visual sections to create a premium, engaging first impression.

### Sections
- **Header Navigation:**
  - **Left:** INGAT Logo.
  - **Center:** Navigation links (`Home`, `How it works`, `Features`).
  - **Right:** `Connect to Wallet` button.
- **Hero Section:**
  - A dynamic, glassmorphic card with the primary "Ingat sa biyahe..." headline.
  - Warm visual aesthetics and floating background blobs.
- **Video Section:**
  - A responsive placeholder frame for an embedded video or product demo.
- **How It Works Section:**
  - Step-by-step layout using bento-grid style cards to explain the remittance process.
- **Features Section:**
  - Grid displaying key benefits (e.g., Zero Hidden Fees, Instant Transfers).
- **Footer:**
  - A distinct background pattern utilizing Stellar-inspired geometric shapes (cross/square grid).
  - Links and copyright information.

### "Connect to Wallet" Modal
- Clicking "Connect to Wallet" in the header opens a new modal (`ConnectWalletModal`).
- The modal will visually display the connection sequence (e.g., "Initializing...", "Waiting for Freighter approval...", "Connected!") using CSS animations.
- Upon completion (simulated via timeouts), it will redirect the user to the unified Dashboard route.

## 2. Unified Dashboard (`DashboardContainer.tsx`)

Currently, the app separates the sender and receiver experiences at the page level. The new UI will consolidate this into a single Dashboard view with toggles.

### Layout & Navigation
- **Header:** Similar to the landing page but with user wallet address and network status.
- **Primary View Switcher:** 
  - Two prominent, pill-shaped toggle buttons: **"Send Money"** (Sender Mode) and **"My Vaults"** (Receiver Mode).
- **Transaction History Tabs:**
  - A tabbed interface at the bottom or side displaying: `All`, `Received`, `Sent/Deposit`.
  - These tabs will filter the list of transaction records shown to the user.

### View Switcher States
- **"Send Money" (Sender Mode):**
  - Displays the XLM deposit UI.
  - Uses the existing input fields (Recipient Address, Amount, Unlock Date) but wrapped in the new premium glassmorphic styling.
- **"My Vaults" (Receiver Mode):**
  - Displays the user's allocated funds.
  - Shows two distinct bucket UI cards: **Available Money** and **Locked Money**.
  - Includes details of the sender (who sent the funds and when).

## 3. Styling Strategy & Constraints
- **Tailwind v4 & `@theme`:** All new styling will rely on the configured tokens in `globals.css` (e.g., `bg-surface-container-lowest`, `text-primary`).
- **Animations:** Implement subtle hover effects (`hover:shadow-2xl`, `hover:-translate-y-1`), and micro-interactions for buttons.
- **Separation of Concerns:**
  - New UI components (like `Header.tsx`, `Hero.tsx`, `ConnectModal.tsx`) will be created in `apps/web/components/ui/`.
  - State management for the tabs and modal will be contained within `LandingContainer.tsx` and `DashboardContainer.tsx`.
- **Real Functionality Maintained:** The new UI components will be wired directly into the existing `WalletContext` and Soroban smart contract hooks. The Freighter connection modal and transaction forms will trigger actual on-chain interactions as they do currently. No *new* smart contract logic will be added, but existing functionality will be strictly preserved.

## 4. Execution Steps
1. Create presentational UI components (`Header`, `Footer`, `ConnectWalletModal`).
2. Update `LandingContainer.tsx` to compose the new landing page sections.
3. Create `DashboardContainer.tsx` and configure the View Switcher (Sender vs Receiver) and Transaction Tabs.
4. Apply the new design tokens and layout to the existing Deposit Form and Bucket Cards.
5. Update `app/page.tsx` and `app/dashboard/page.tsx` to render the updated containers.
