import { renderHook, act } from '@testing-library/react';
import { useSenderBuckets } from '@/hooks/useSenderBuckets';

const mockSupabaseClient = {};

// Mock dependencies
jest.mock('@/lib/stellar/contract', () => ({
  fetchBucketBalances: jest.fn(),
  buildWithdrawGoalSenderTx: jest.fn(),
  submitTransaction: jest.fn(),
}));

jest.mock('@/lib/stellar/freighter', () => ({
  signTxWithFreighter: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  fetchSentTransactions: jest.fn(),
  insertTransaction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/context/WalletContext', () => ({
  useWalletContext: () => ({ supabaseClient: mockSupabaseClient }),
}));

jest.mock('@/hooks/useXlmPrice', () => ({
  useXlmPrice: () => ({ priceUsd: 0.15, loading: false }),
}));

import { fetchBucketBalances, buildWithdrawGoalSenderTx, submitTransaction } from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';
import { fetchSentTransactions } from '@/lib/supabase';

const SENDER_ADDRESS = 'GBZXN7PIRZGNMHGA7MUUUF4GWUQESTCDVWAYQOTNCFYMZ7GF3VG7DKIW';
const RECEIVER_ADDRESS = 'GDXKVV5BGBDRNSJDCZAEX3XMXWD6Z2WBCHBCT55ZFWG6R2RL5MMTZR3Y';

describe('useSenderBuckets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default empty state', () => {
    (fetchSentTransactions as jest.Mock).mockResolvedValue([]);
    const { result } = renderHook(() => useSenderBuckets(null));

    expect(result.current.buckets).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads sender buckets successfully', async () => {
    const mockTxHistory = [
      {
        type: 'deposit',
        sender_address: SENDER_ADDRESS,
        receiver_address: RECEIVER_ADDRESS,
        amount: 150,
      },
    ];

    const mockBalances = [
      {
        id: 1,
        sender: SENDER_ADDRESS,
        spendingBalance: 50,
        goalBalance: 100,
        unlockDate: Math.floor(Date.now() / 1000) + 1000,
      },
    ];

    (fetchSentTransactions as jest.Mock).mockResolvedValue(mockTxHistory);
    (fetchBucketBalances as jest.Mock).mockResolvedValue(mockBalances);

    const { result } = renderHook(() => useSenderBuckets(SENDER_ADDRESS));

    // Wait for the hook state to update after fetch
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchSentTransactions).toHaveBeenCalledWith(SENDER_ADDRESS, mockSupabaseClient);
    expect(fetchBucketBalances).toHaveBeenCalledWith(RECEIVER_ADDRESS);
    expect(result.current.buckets.length).toBe(1);
    expect(result.current.buckets[0].receiverAddress).toBe(RECEIVER_ADDRESS);
    expect(result.current.buckets[0].goalBalance).toBe(100);
    expect(result.current.buckets[0].id).toBe(1);
  });

  it('handles withdrawSenderGoal successfully', async () => {
    const mockXdr = 'mock-unsigned-xdr';
    const mockSignedXdr = 'mock-signed-xdr';
    const mockHash = 'mock-reclaim-hash';

    (buildWithdrawGoalSenderTx as jest.Mock).mockResolvedValue(mockXdr);
    (signTxWithFreighter as jest.Mock).mockResolvedValue(mockSignedXdr);
    (submitTransaction as jest.Mock).mockResolvedValue(mockHash);

    const { result } = renderHook(() => useSenderBuckets(SENDER_ADDRESS));

    let success = false;
    await act(async () => {
      success = await result.current.withdrawSenderGoal(RECEIVER_ADDRESS, 1, 100);
    });

    expect(success).toBe(true);
    expect(buildWithdrawGoalSenderTx).toHaveBeenCalledWith(SENDER_ADDRESS, RECEIVER_ADDRESS, 1, 100);
    expect(signTxWithFreighter).toHaveBeenCalledWith(mockXdr, SENDER_ADDRESS);
    expect(submitTransaction).toHaveBeenCalledWith(mockSignedXdr);
  });

  it('handles withdrawSenderGoal wallet not connected', async () => {
    const { result } = renderHook(() => useSenderBuckets(null));

    let success = true;
    await act(async () => {
      success = await result.current.withdrawSenderGoal(RECEIVER_ADDRESS, 1, 100);
    });

    expect(success).toBe(false);
    expect(result.current.withdrawError).toBe('Wallet not connected');
  });
});
