import { DepositFormInputs, DepositParams } from '@/types/transaction';

export interface ValidationError {
  field: keyof DepositFormInputs;
  message: string;
}

export const validateDeposit = (inputs: DepositFormInputs): ValidationError[] => {
  const errors: ValidationError[] = [];

  const receiver = inputs.receiver.trim();
  if (!receiver) {
    errors.push({ field: 'receiver', message: 'Receiver address is required' });
  } else if (!/^G[A-Z2-7]{55}$/.test(receiver)) {
    errors.push({ field: 'receiver', message: 'Invalid Stellar public key format' });
  }

  const amount = parseFloat(inputs.amount);
  if (!inputs.amount) {
    errors.push({ field: 'amount', message: 'Amount is required' });
  } else if (isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number' });
  }

  const splitRatio = inputs.splitRatio;
  if (splitRatio < 0 || splitRatio > 100) {
    errors.push({ field: 'splitRatio', message: 'Split ratio must be between 0% and 100%' });
  }

  if (!inputs.unlockDate) {
    errors.push({ field: 'unlockDate', message: 'Unlock date is required' });
  } else {
    const selectedDate = new Date(inputs.unlockDate);
    const now = new Date();
    if (isNaN(selectedDate.getTime())) {
      errors.push({ field: 'unlockDate', message: 'Invalid date format' });
    } else if (selectedDate <= now) {
      errors.push({ field: 'unlockDate', message: 'Unlock date must be in the future' });
    }
  }

  return errors;
};

// Keep old validation functions for backward compatibility
export function validateSplitRatio(ratio: number): {
  valid: boolean;
  error?: string;
} {
  if (!Number.isFinite(ratio) || ratio < 1 || ratio > 99) {
    return { valid: false, error: 'Split ratio must be between 1 and 99' };
  }
  return { valid: true };
}

export function validateUnlockDate(date: string): {
  valid: boolean;
  error?: string;
} {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  if (parsed.getTime() <= Date.now()) {
    return { valid: false, error: 'Unlock date must be in the future' };
  }
  return { valid: true };
}

export function validateDepositAmount(amount: string): {
  valid: boolean;
  error?: string;
} {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }
  return { valid: true };
}

export function validateReceiverAddress(address: string): {
  valid: boolean;
  error?: string;
} {
  if (!address.startsWith('G') || address.length !== 56) {
    return {
      valid: false,
      error: 'Address must start with G and be 56 characters',
    };
  }
  return { valid: true };
}

export function validateDepositOld(params: DepositParams): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const amountResult = validateDepositAmount(params.amount);
  if (!amountResult.valid) errors.amount = amountResult.error!;

  const ratioResult = validateSplitRatio(params.splitRatio);
  if (!ratioResult.valid) errors.splitRatio = ratioResult.error!;

  const addressResult = validateReceiverAddress(params.receiverAddress);
  if (!addressResult.valid) errors.receiverAddress = addressResult.error!;

  const dateResult = validateUnlockDate(params.unlockDate);
  if (!dateResult.valid) errors.unlockDate = dateResult.error!;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
