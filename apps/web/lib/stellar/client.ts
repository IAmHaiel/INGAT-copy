import { rpc, Networks } from '@stellar/stellar-sdk';

export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(RPC_URL);

// Contract IDs — set via environment variables (.env.local)
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';

export const TOKEN_ID = process.env.NEXT_PUBLIC_TOKEN_ID || '';
