import { getLevenshteinDistance } from '@/lib/utils/levenshtein';
import { checkAddressSafety } from '@/lib/validation/addressSafety';

// Mock @stellar/stellar-sdk to avoid Jest ESM issues in node_modules
jest.mock('@stellar/stellar-sdk', () => ({
  StrKey: {
    isValidEd25519PublicKey: jest.fn((address: string) => {
      // Simulate real Stellar address validation rules (starts with G, length 56, standard base32 alphabet: A-Z, 2-7)
      return (
        address.length === 56 &&
        address.startsWith('G') &&
        /^[A-Z2-7]+$/.test(address)
      );
    }),
  },
}));

describe('Levenshtein Distance Utility', () => {
  it('should compute correct distance for substitutions, insertions, and deletions', () => {
    expect(getLevenshteinDistance('abc', 'abc')).toBe(0);
    expect(getLevenshteinDistance('abc', 'abd')).toBe(1);
    expect(getLevenshteinDistance('abc', 'ab')).toBe(1);
    expect(getLevenshteinDistance('abc', 'abcd')).toBe(1);
    expect(getLevenshteinDistance('kitten', 'sitting')).toBe(3);
  });
});

describe('checkAddressSafety Validator', () => {
  // Mock valid 56-char Stellar pubkeys (using A-Z and 2-7 only)
  const knownAddress1 = 'GD7R76YQ3Y7BCE6S5O5R5K5A5L5K5M5J5H5G5F5D5S5A5P5O5A5U5Y5T';
  const knownAddress2 = 'GA5XNXO2R3TY5Q4A3M2L3K4J5A6H7G6F5E4D3C2B3A4Z5Y6X7W6V5U4T';

  it('should return malformed for invalid Stellar public keys', () => {
    expect(checkAddressSafety('invalid-key', []).state).toBe('malformed');
    expect(checkAddressSafety('GA5XNXO2', []).state).toBe('malformed'); // too short
  });

  it('should return valid for exact matches of known addresses', () => {
    const result = checkAddressSafety(knownAddress1, [knownAddress1, knownAddress2]);
    expect(result.state).toBe('valid');
  });

  it('should return first-time for valid addresses never used before', () => {
    // A valid base-32 key that is completely different
    const validFirstTime = 'GC3O5M6Q7T2U3V4W5X2Y3Z4A5B6C7D5E4F3A2B2C3D4E5F6G7H2J3K4L';
    const result = checkAddressSafety(validFirstTime, [knownAddress1, knownAddress2]);
    expect(result.state).toBe('first-time');
  });

  it('should return near-miss for addresses with distance 1 or 2 from known addresses', () => {
    // Replace one character at the end of knownAddress1
    const nearMiss1 = knownAddress1.substring(0, 55) + 'A';
    // Replace two characters at the end of knownAddress1
    const nearMiss2 = knownAddress1.substring(0, 54) + 'AB';

    const result1 = checkAddressSafety(nearMiss1, [knownAddress1]);
    expect(result1.state).toBe('near-miss');
    expect(result1.similarAddress).toBe(knownAddress1);

    const result2 = checkAddressSafety(nearMiss2, [knownAddress1]);
    expect(result2.state).toBe('near-miss');
    expect(result2.similarAddress).toBe(knownAddress1);
  });
});
