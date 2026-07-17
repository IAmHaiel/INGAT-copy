export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || 'CDNCRZ3GQTDUD2VIPTRGNM7SZLML27LW3LAYISECDVDEFTTGURSLS7XC';
export const TOKEN_ID = process.env.NEXT_PUBLIC_TOKEN_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ||
  'Test SDF Network ; September 2015';
export const NETWORK = 'testnet' as const;
