import { NextRequest, NextResponse } from 'next/server';

const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 300;

/**
 * Proxy route for Soroban JSON-RPC calls.
 *
 * The @stellar/stellar-sdk uses feaxios (a fetch-based HTTP client) to make
 * RPC calls from the browser. Under Next.js 16 + Turbopack dev mode, these
 * cross-origin fetch calls fail with "NetworkError when attempting to fetch
 * resource" in Firefox. Routing through a same-origin API proxy eliminates
 * the issue entirely.
 *
 * Includes retry with exponential backoff for transient errors (503, 429, 502).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }

      lastResponse = await fetch(SOROBAN_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Name': 'js-stellar-sdk',
          'X-Client-Version': 'ingat-proxy',
        },
        body,
      });

      // Retry on transient server errors
      if (lastResponse.status === 503 || lastResponse.status === 502 || lastResponse.status === 429) {
        if (attempt < MAX_RETRIES) {
          continue;
        }
      }

      // Success or non-retryable error — return immediately
      break;
    }

    const data = await lastResponse!.text();

    return new NextResponse(data, {
      status: lastResponse!.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('[RPC Proxy] Error forwarding request:', err);
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32603, message: 'RPC proxy error' } },
      { status: 502 }
    );
  }
}
