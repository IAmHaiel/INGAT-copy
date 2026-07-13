import { rpc, Networks } from '@stellar/stellar-sdk';

export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(RPC_URL);

// Contract IDs — set via environment variables (.env.local)
// Run `npm run contract:deploy` to deploy and get these values.
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
export const STABLECOIN_TOKEN_ID = process.env.NEXT_PUBLIC_STABLECOIN_TOKEN_ID || '';
