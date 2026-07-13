import { rpc, Networks } from '@stellar/stellar-sdk';

export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(RPC_URL);

// Valid contract IDs for testnet (using real, checksum-valid Strkeys)
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || 'CBUSYNQKASUYFWYC3M2GUEDMX4AIVWPALDBYJPNK6554BREHTGZ2IUNF'; 
export const STABLECOIN_TOKEN_ID = process.env.NEXT_PUBLIC_STABLECOIN_TOKEN_ID || 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
