import {
  validateDeposit,
  validateSplitRatio,
  validateUnlockDate,
  validateDepositAmount,
  validateReceiverAddress,
  validateDepositOld,
} from '@/lib/validation/deposit';
import { DepositFormInputs, DepositParams } from '@/types/transaction';

const VALID_STELLAR_KEY = 'GBZXN7PIRZGNMHGA7MUUUF4GWUQESTCDVWAYQOTNCFYMZ7GF3VG7DKIW';

function futureDate(daysAhead = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

function pastDate(daysAgo = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function validInputs(overrides?: Partial<DepositFormInputs>): DepositFormInputs {
  return {
    receiver: VALID_STELLAR_KEY,
    amount: '100',
    splitRatio: 50,
    unlockDate: futureDate(),
    goalLabel: 'Test Goal',
    ...overrides,
  };
}

// =============================================================================
// validateDeposit
// =============================================================================
describe('validateDeposit', () => {
  it('returns no errors for valid inputs', () => {
    const errors = validateDeposit(validInputs());
    expect(errors).toHaveLength(0);
  });

  describe('receiver validation', () => {
    it('returns error when receiver is empty', () => {
      const errors = validateDeposit(validInputs({ receiver: '' }));
      expect(errors).toContainEqual({
        field: 'receiver',
        message: 'Receiver address is required',
      });
    });

    it('returns error when receiver is only whitespace', () => {
      const errors = validateDeposit(validInputs({ receiver: '   ' }));
      expect(errors).toContainEqual({
        field: 'receiver',
        message: 'Receiver address is required',
      });
    });

    it('returns error for invalid Stellar public key format', () => {
      const errors = validateDeposit(validInputs({ receiver: 'INVALID_KEY' }));
      expect(errors).toContainEqual({
        field: 'receiver',
        message: 'Invalid Stellar public key format',
      });
    });

    it('returns error for key not starting with G', () => {
      const errors = validateDeposit(
        validInputs({ receiver: 'S' + 'A'.repeat(55) })
      );
      expect(errors).toContainEqual({
        field: 'receiver',
        message: 'Invalid Stellar public key format',
      });
    });

    it('returns error for key with wrong length', () => {
      const errors = validateDeposit(validInputs({ receiver: 'G' + 'A'.repeat(50) }));
      expect(errors).toContainEqual({
        field: 'receiver',
        message: 'Invalid Stellar public key format',
      });
    });

    it('returns error for key with lowercase characters', () => {
      const errors = validateDeposit(
        validInputs({ receiver: 'G' + 'a'.repeat(55) })
      );
      expect(errors).toContainEqual({
        field: 'receiver',
        message: 'Invalid Stellar public key format',
      });
    });
  });

  describe('amount validation', () => {
    it('returns error when amount is empty', () => {
      const errors = validateDeposit(validInputs({ amount: '' }));
      expect(errors).toContainEqual({
        field: 'amount',
        message: 'Amount is required',
      });
    });

    it('returns error for negative amount', () => {
      const errors = validateDeposit(validInputs({ amount: '-5' }));
      expect(errors).toContainEqual({
        field: 'amount',
        message: 'Amount must be a positive number',
      });
    });

    it('returns error for zero amount', () => {
      const errors = validateDeposit(validInputs({ amount: '0' }));
      expect(errors).toContainEqual({
        field: 'amount',
        message: 'Amount must be a positive number',
      });
    });

    it('returns error for non-numeric amount', () => {
      const errors = validateDeposit(validInputs({ amount: 'abc' }));
      expect(errors).toContainEqual({
        field: 'amount',
        message: 'Amount must be a positive number',
      });
    });

    it('accepts decimal amounts', () => {
      const errors = validateDeposit(validInputs({ amount: '0.5' }));
      const amountErrors = errors.filter((e) => e.field === 'amount');
      expect(amountErrors).toHaveLength(0);
    });
  });

  describe('splitRatio validation', () => {
    it('accepts ratio of 0 (boundary)', () => {
      const errors = validateDeposit(validInputs({ splitRatio: 0 }));
      const ratioErrors = errors.filter((e) => e.field === 'splitRatio');
      expect(ratioErrors).toHaveLength(0);
    });

    it('accepts ratio of 100 (boundary)', () => {
      const errors = validateDeposit(validInputs({ splitRatio: 100 }));
      const ratioErrors = errors.filter((e) => e.field === 'splitRatio');
      expect(ratioErrors).toHaveLength(0);
    });

    it('returns error for ratio below 0', () => {
      const errors = validateDeposit(validInputs({ splitRatio: -1 }));
      expect(errors).toContainEqual({
        field: 'splitRatio',
        message: 'Split ratio must be between 0% and 100%',
      });
    });

    it('returns error for ratio above 100', () => {
      const errors = validateDeposit(validInputs({ splitRatio: 101 }));
      expect(errors).toContainEqual({
        field: 'splitRatio',
        message: 'Split ratio must be between 0% and 100%',
      });
    });
  });

  describe('unlockDate validation', () => {
    it('returns error when unlock date is empty', () => {
      const errors = validateDeposit(validInputs({ unlockDate: '' }));
      expect(errors).toContainEqual({
        field: 'unlockDate',
        message: 'Unlock date is required',
      });
    });

    it('returns error for past unlock date', () => {
      const errors = validateDeposit(validInputs({ unlockDate: pastDate() }));
      expect(errors).toContainEqual({
        field: 'unlockDate',
        message: 'Unlock date must be in the future',
      });
    });

    it('returns error for invalid date format', () => {
      const errors = validateDeposit(validInputs({ unlockDate: 'not-a-date' }));
      expect(errors).toContainEqual({
        field: 'unlockDate',
        message: 'Invalid date format',
      });
    });

    it('accepts future date', () => {
      const errors = validateDeposit(validInputs({ unlockDate: futureDate(365) }));
      const dateErrors = errors.filter((e) => e.field === 'unlockDate');
      expect(dateErrors).toHaveLength(0);
    });
  });

  it('returns multiple errors for multiple invalid fields', () => {
    const errors = validateDeposit({
      receiver: '',
      amount: '',
      splitRatio: -1,
      unlockDate: '',
      goalLabel: '',
    });
    expect(errors.length).toBeGreaterThanOrEqual(4);
    expect(errors.map((e) => e.field)).toContain('receiver');
    expect(errors.map((e) => e.field)).toContain('amount');
    expect(errors.map((e) => e.field)).toContain('splitRatio');
    expect(errors.map((e) => e.field)).toContain('unlockDate');
  });
});

// =============================================================================
// validateSplitRatio
// =============================================================================
describe('validateSplitRatio', () => {
  it('returns valid for ratio of 1', () => {
    expect(validateSplitRatio(1)).toEqual({ valid: true });
  });

  it('returns valid for ratio of 50', () => {
    expect(validateSplitRatio(50)).toEqual({ valid: true });
  });

  it('returns valid for ratio of 99', () => {
    expect(validateSplitRatio(99)).toEqual({ valid: true });
  });

  it('returns invalid for ratio of 0', () => {
    const result = validateSplitRatio(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Split ratio must be between 1 and 99');
  });

  it('returns invalid for ratio of 100', () => {
    const result = validateSplitRatio(100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Split ratio must be between 1 and 99');
  });

  it('returns invalid for negative ratio', () => {
    const result = validateSplitRatio(-10);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Split ratio must be between 1 and 99');
  });

  it('returns invalid for NaN', () => {
    const result = validateSplitRatio(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Split ratio must be between 1 and 99');
  });

  it('returns invalid for Infinity', () => {
    const result = validateSplitRatio(Infinity);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Split ratio must be between 1 and 99');
  });

  it('returns invalid for -Infinity', () => {
    const result = validateSplitRatio(-Infinity);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Split ratio must be between 1 and 99');
  });
});

// =============================================================================
// validateUnlockDate
// =============================================================================
describe('validateUnlockDate', () => {
  it('returns valid for a future date', () => {
    expect(validateUnlockDate(futureDate())).toEqual({ valid: true });
  });

  it('returns invalid for a past date', () => {
    const result = validateUnlockDate(pastDate());
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Unlock date must be in the future');
  });

  it('returns invalid for an invalid date string', () => {
    const result = validateUnlockDate('not-a-real-date');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid date format');
  });

  it('returns invalid for empty string', () => {
    const result = validateUnlockDate('');
    expect(result.valid).toBe(false);
    // Empty string parsed by new Date() is invalid
    expect(result.error).toBe('Invalid date format');
  });

  it('accepts ISO date string in the future', () => {
    const future = new Date(Date.now() + 86400000 * 60).toISOString();
    expect(validateUnlockDate(future).valid).toBe(true);
  });
});

// =============================================================================
// validateDepositAmount
// =============================================================================
describe('validateDepositAmount', () => {
  it('returns valid for positive amount', () => {
    expect(validateDepositAmount('100')).toEqual({ valid: true });
  });

  it('returns valid for small decimal amount', () => {
    expect(validateDepositAmount('0.0000001')).toEqual({ valid: true });
  });

  it('returns invalid for zero', () => {
    const result = validateDepositAmount('0');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be a positive number');
  });

  it('returns invalid for negative amount', () => {
    const result = validateDepositAmount('-50');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be a positive number');
  });

  it('returns invalid for non-numeric string', () => {
    const result = validateDepositAmount('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be a positive number');
  });

  it('returns invalid for empty string', () => {
    const result = validateDepositAmount('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be a positive number');
  });
});

// =============================================================================
// validateReceiverAddress
// =============================================================================
describe('validateReceiverAddress', () => {
  it('returns valid for correct 56-char G-address', () => {
    expect(validateReceiverAddress(VALID_STELLAR_KEY)).toEqual({ valid: true });
  });

  it('returns invalid for address not starting with G', () => {
    const result = validateReceiverAddress('S' + 'A'.repeat(55));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Address must start with G and be 56 characters');
  });

  it('returns invalid for address shorter than 56 characters', () => {
    const result = validateReceiverAddress('G' + 'A'.repeat(40));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Address must start with G and be 56 characters');
  });

  it('returns invalid for address longer than 56 characters', () => {
    const result = validateReceiverAddress('G' + 'A'.repeat(60));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Address must start with G and be 56 characters');
  });

  it('returns invalid for empty string', () => {
    const result = validateReceiverAddress('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Address must start with G and be 56 characters');
  });
});

// =============================================================================
// validateDepositOld
// =============================================================================
describe('validateDepositOld', () => {
  function validParams(overrides?: Partial<DepositParams>): DepositParams {
    return {
      amount: '100',
      splitRatio: 50,
      receiverAddress: VALID_STELLAR_KEY,
      unlockDate: futureDate(),
      ...overrides,
    };
  }

  it('returns valid with no errors for correct params', () => {
    const result = validateDepositOld(validParams());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns invalid with amount error for bad amount', () => {
    const result = validateDepositOld(validParams({ amount: '-5' }));
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBe('Amount must be a positive number');
  });

  it('returns invalid with splitRatio error for out-of-range ratio', () => {
    const result = validateDepositOld(validParams({ splitRatio: 0 }));
    expect(result.valid).toBe(false);
    expect(result.errors.splitRatio).toBe('Split ratio must be between 1 and 99');
  });

  it('returns invalid with receiverAddress error for bad address', () => {
    const result = validateDepositOld(validParams({ receiverAddress: 'bad' }));
    expect(result.valid).toBe(false);
    expect(result.errors.receiverAddress).toBe(
      'Address must start with G and be 56 characters'
    );
  });

  it('returns invalid with unlockDate error for past date', () => {
    const result = validateDepositOld(validParams({ unlockDate: pastDate() }));
    expect(result.valid).toBe(false);
    expect(result.errors.unlockDate).toBe('Unlock date must be in the future');
  });

  it('returns multiple errors when multiple fields are invalid', () => {
    const result = validateDepositOld({
      amount: '0',
      splitRatio: 200,
      receiverAddress: 'X',
      unlockDate: 'invalid',
    });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(4);
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.splitRatio).toBeDefined();
    expect(result.errors.receiverAddress).toBeDefined();
    expect(result.errors.unlockDate).toBeDefined();
  });
});
