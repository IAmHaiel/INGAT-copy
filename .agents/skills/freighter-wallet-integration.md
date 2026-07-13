# Freighter Wallet Integration for INGAT

This guide explains how to connect and interact with Freighter wallet inside the INGAT app.

## 1. Network Detection
INGAT operates on **Stellar Testnet**.
- Before proceeding with deposits or withdrawals, query the network and check if it is `TESTNET`.
- If the user is on `PUBLIC` or another network, trigger an overlay or banner warning.

## 2. API Integration
Use `@stellar/freighter-api` to retrieve public key and request transaction signatures:
- `isConnected()`: Check if Freighter extension is installed.
- `getPublicKey()`: Get the active public key.
- `signTransaction(xdr, { network: "TESTNET" })`: Submit XDR to Freighter for signing.

## 3. Custom Hook (`useWallet.ts`)
Encapsulate all wallet state in `useWallet` hook:
- `publicKey`: `string | null`
- `isConnected`: `boolean`
- `isConnecting`: `boolean`
- `error`: `string | null`
- `connect()`: Trigger request for access.
- `disconnect()`: Clear state and reset dashboards.
