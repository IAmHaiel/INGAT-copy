import { renderHook, act } from '@testing-library/react';
import { useWithdraw } from '@/hooks/useWithdraw';

// Mock dependencies
jest.mock('@/lib/stellar/contract', () => ({
  buildWithdrawSpendingTx: jest.fn(),
  buildWithdrawGoalTx: jest.fn(),
  submitTransaction: jest.fn(),
}));

jest.mock('@/lib/stellar/freighter', () => ({
  signTxWithFreighter: jest.fn(),
}));

import {
  buildWithdrawSpendingTx,
  buildWithdrawGoalTx,
  submitTransaction,
} from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';

const RECEIVER_ADDRESS = 'GBZXN7PIRZGNMHGA7MUUUF4GWUQESTCDVWAYQOTNCFYMZ7GF3VG7DKIW';

describe('useWithdraw', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useWithdraw(RECEIVER_ADDRESS));

    expect(result.current.isWithdrawing).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.txHash).toBeNull();
  });

  it('sets error when wallet is not connected', async () => {
    const { result } = renderHook(() => useWithdraw(null));

    await act(async () => {
      await result.current.withdraw(1, 'spending', 50);
    });

    expect(result.current.error).toBe('Wallet not connected');
  });

  it('sets error when amount is zero', async () => {
    const { result } = renderHook(() => useWithdraw(RECEIVER_ADDRESS));

    await act(async () => {
      await result.current.withdraw(1, 'spending', 0);
    });

    expect(result.current.error).toBe('Amount must be greater than zero');
  });

  it('sets error when amount is negative', async () => {
    const { result } = renderHook(() => useWithdraw(RECEIVER_ADDRESS));

    await act(async () => {
      await result.current.withdraw(1, 'spending', -10);
    });

    expect(result.current.error).toBe('Amount must be greater than zero');
  });

  it('successfully withdraws from spending bucket', async () => {
    const mockXdr = 'mock-xdr';
    const mockSignedXdr = 'mock-signed-xdr';
    const mockHash = 'spending-tx-hash';

    (buildWithdrawSpendingTx as jest.Mock).mockResolvedValue(mockXdr);
    (signTxWithFreighter as jest.Mock).mockResolvedValue(mockSignedXdr);
    (submitTransaction as jest.Mock).mockResolvedValue(mockHash);

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useWithdraw(RECEIVER_ADDRESS, onSuccess));

    await act(async () => {
      await result.current.withdraw(1, 'spending', 50);
    });

    expect(buildWithdrawSpendingTx).toHaveBeenCalledWith(RECEIVER_ADDRESS, 1, 50);
    expect(signTxWithFreighter).toHaveBeenCalledWith(mockXdr, RECEIVER_ADDRESS);
    expect(submitTransaction).toHaveBeenCalledWith(mockSignedXdr);
    expect(result.current.txHash).toBe(mockHash);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(mockHash);
  });

  it('successfully withdraws from goal bucket', async () => {
    const mockXdr = 'mock-xdr';
    const mockSignedXdr = 'mock-signed-xdr';
    const mockHash = 'goal-tx-hash';

    (buildWithdrawGoalTx as jest.Mock).mockResolvedValue(mockXdr);
    (signTxWithFreighter as jest.Mock).mockResolvedValue(mockSignedXdr);
    (submitTransaction as jest.Mock).mockResolvedValue(mockHash);

    const { result } = renderHook(() => useWithdraw(RECEIVER_ADDRESS));

    await act(async () => {
      await result.current.withdraw(2, 'goal', 100);
    });

    expect(buildWithdrawGoalTx).toHaveBeenCalledWith(RECEIVER_ADDRESS, 2, 100);
    expect(result.current.txHash).toBe(mockHash);
    expect(result.current.error).toBeNull();
  });

  it('handles transaction failure', async () => {
    (buildWithdrawSpendingTx as jest.Mock).mockResolvedValue('xdr');
    (signTxWithFreighter as jest.Mock).mockRejectedValue(new Error('Signing rejected'));

    const { result } = renderHook(() => useWithdraw(RECEIVER_ADDRESS));

    await act(async () => {
      await result.current.withdraw(1, 'spending', 25);
    });

    expect(result.current.error).toBe('Signing rejected');
    expect(result.current.txHash).toBeNull();
  });

  it('tracks isWithdrawing state with bucket ID', async () => {
    let resolveSign: (val: string) => void;
    const signPromise = new Promise<string>((resolve) => {
      resolveSign = resolve;
    });

    (buildWithdrawSpendingTx as jest.Mock).mockResolvedValue('xdr');
    (signTxWithFreighter as jest.Mock).mockReturnValue(signPromise);
    (submitTransaction as jest.Mock).mockResolvedValue('hash');

    const { result } = renderHook(() => useWithdraw(RECEIVER_ADDRESS));

    let withdrawPromise: Promise<void>;
    act(() => {
      withdrawPromise = result.current.withdraw(3, 'spending', 10);
    });

    // isWithdrawing should be set to the bucket ID
    expect(result.current.isWithdrawing).toBe(3);

    await act(async () => {
      resolveSign!('signed');
      await withdrawPromise;
    });

    expect(result.current.isWithdrawing).toBeNull();
  });
});
