import { renderHook, act } from '@testing-library/react';
import { useDeposit } from '@/hooks/useDeposit';
import { DepositFormInputs } from '@/types/transaction';

// Mock dependencies
jest.mock('@/lib/stellar/contract', () => ({
  buildDepositTx: jest.fn(),
  submitTransaction: jest.fn(),
}));

jest.mock('@/lib/stellar/freighter', () => ({
  signTxWithFreighter: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  insertTransaction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/context/WalletContext', () => ({
  useWalletContext: () => ({ supabaseClient: null }),
}));

import { buildDepositTx, submitTransaction } from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';

const VALID_STELLAR_KEY = 'GBZXN7PIRZGNMHGA7MUUUF4GWUQESTCDVWAYQOTNCFYMZ7GF3VG7DKIW';

function futureDate(daysAhead = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

function validInputs(): DepositFormInputs {
  return {
    receiver: VALID_STELLAR_KEY,
    amount: '100',
    splitRatio: 60,
    unlockDate: futureDate(),
    goalLabel: 'Test Goal',
  };
}

describe('useDeposit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useDeposit(VALID_STELLAR_KEY));

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errors).toEqual([]);
    expect(result.current.txError).toBeNull();
    expect(result.current.txHash).toBeNull();
  });

  it('returns validation errors for invalid inputs', async () => {
    const { result } = renderHook(() => useDeposit(VALID_STELLAR_KEY));

    let success: boolean = false;
    await act(async () => {
      success = await result.current.deposit({
        receiver: '',
        amount: '',
        splitRatio: -1,
        unlockDate: '',
        goalLabel: '',
      });
    });

    expect(success).toBe(false);
    expect(result.current.errors.length).toBeGreaterThan(0);
    expect(result.current.errors.some((e) => e.field === 'receiver')).toBe(true);
    expect(result.current.errors.some((e) => e.field === 'amount')).toBe(true);
  });

  it('returns txError when wallet is not connected', async () => {
    const { result } = renderHook(() => useDeposit(null));

    let success: boolean = false;
    await act(async () => {
      success = await result.current.deposit(validInputs());
    });

    expect(success).toBe(false);
    expect(result.current.txError).toBe('Wallet not connected');
  });

  it('submits transaction successfully', async () => {
    const mockXdr = 'mock-unsigned-xdr';
    const mockSignedXdr = 'mock-signed-xdr';
    const mockHash = 'abc123txhash';

    (buildDepositTx as jest.Mock).mockResolvedValue(mockXdr);
    (signTxWithFreighter as jest.Mock).mockResolvedValue(mockSignedXdr);
    (submitTransaction as jest.Mock).mockResolvedValue(mockHash);

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useDeposit(VALID_STELLAR_KEY, onSuccess));

    let success: boolean = false;
    await act(async () => {
      success = await result.current.deposit(validInputs());
    });

    expect(success).toBe(true);
    expect(result.current.txHash).toBe(mockHash);
    expect(result.current.txError).toBeNull();
    expect(result.current.errors).toEqual([]);
    expect(onSuccess).toHaveBeenCalledWith(mockHash);
  });

  it('handles transaction signing failure', async () => {
    const mockXdr = 'mock-unsigned-xdr';
    (buildDepositTx as jest.Mock).mockResolvedValue(mockXdr);
    (signTxWithFreighter as jest.Mock).mockRejectedValue(new Error('User rejected'));

    const { result } = renderHook(() => useDeposit(VALID_STELLAR_KEY));

    let success: boolean = false;
    await act(async () => {
      success = await result.current.deposit(validInputs());
    });

    expect(success).toBe(false);
    expect(result.current.txError).toBe('User rejected');
    expect(result.current.txHash).toBeNull();
  });

  it('handles transaction submission failure', async () => {
    const mockXdr = 'mock-unsigned-xdr';
    const mockSignedXdr = 'mock-signed-xdr';

    (buildDepositTx as jest.Mock).mockResolvedValue(mockXdr);
    (signTxWithFreighter as jest.Mock).mockResolvedValue(mockSignedXdr);
    (submitTransaction as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDeposit(VALID_STELLAR_KEY));

    let success: boolean = false;
    await act(async () => {
      success = await result.current.deposit(validInputs());
    });

    expect(success).toBe(false);
    expect(result.current.txError).toBe('Network error');
  });

  it('sets isSubmitting during transaction processing', async () => {
    let resolveSign: (val: string) => void;
    const signPromise = new Promise<string>((resolve) => {
      resolveSign = resolve;
    });

    (buildDepositTx as jest.Mock).mockResolvedValue('xdr');
    (signTxWithFreighter as jest.Mock).mockReturnValue(signPromise);
    (submitTransaction as jest.Mock).mockResolvedValue('hash');

    const { result } = renderHook(() => useDeposit(VALID_STELLAR_KEY));

    let depositPromise: Promise<boolean>;
    act(() => {
      depositPromise = result.current.deposit(validInputs());
    });

    // Should be submitting while awaiting
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveSign!('signed');
      await depositPromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});
