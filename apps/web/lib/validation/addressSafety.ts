import { StrKey } from '@stellar/stellar-sdk';
import { getLevenshteinDistance } from '../utils/levenshtein';

export type AddressSafetyState = 'valid' | 'malformed' | 'first-time' | 'near-miss' | 'unknown';

export interface AddressSafetyResult {
  state: AddressSafetyState;
  similarAddress?: string;
}

/**
 * Validates a receiver address against security rules:
 * 1. Malformed check (Stellar StrKey)
 * 2. Exact match check
 * 3. Near-miss check (Levenshtein distance 1 or 2)
 * 4. First-time recipient check
 */
export function checkAddressSafety(
  address: string,
  knownAddresses: string[]
): AddressSafetyResult {
  if (!address) {
    return { state: 'unknown' };
  }

  // 1. Malformed check
  try {
    if (!StrKey.isValidEd25519PublicKey(address)) {
      return { state: 'malformed' };
    }
  } catch (err) {
    return { state: 'malformed' };
  }

  // 2. Exact match check
  if (knownAddresses.includes(address)) {
    return { state: 'valid' };
  }

  // 3. Near-miss check (distance is 1 or 2)
  for (const known of knownAddresses) {
    const dist = getLevenshteinDistance(address, known);
    if (dist === 1 || dist === 2) {
      return { state: 'near-miss', similarAddress: known };
    }
  }

  // 4. First-time address warning
  return { state: 'first-time' };
}
