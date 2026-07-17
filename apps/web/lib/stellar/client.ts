import { rpc, Networks } from '@stellar/stellar-sdk';

export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/**
 * Use a same-origin API proxy for RPC calls in the browser.
 * This avoids "NetworkError when attempting to fetch resource" caused by
 * feaxios + Turbopack dev server incompatibility with cross-origin fetch.
 * Server-side (build, Node.js) calls go directly to the RPC endpoint.
 *
 * The server instance is lazily created on first access so that
 * window.location is available for determining the proxy origin.
 */
let _server: rpc.Server | null = null;

export function getServer(): rpc.Server {
  if (!_server) {
    if (typeof window !== 'undefined') {
      const proxyUrl = `${window.location.origin}/api/rpc`;
      _server = new rpc.Server(proxyUrl, { allowHttp: true });
    } else {
      _server = new rpc.Server(RPC_URL);
    }
  }
  return _server;
}

// Contract IDs — set via environment variables (.env.local)
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || 'CAB4QC535QY7VCNKUC7S7SMC4MA6TUFUAYAIZLYRPYUILYKTRDLSQPNT';

export const TOKEN_ID = process.env.NEXT_PUBLIC_TOKEN_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
