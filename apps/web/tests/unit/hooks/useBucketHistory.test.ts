import { renderHook, act } from '@testing-library/react';
import { useBucketHistory } from '@/hooks/useBucketHistory';

const mockSupabaseClient = {};

// Mock dependencies
jest.mock('@/lib/stellar/contract', () => ({
  fetchBucketBalances: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  fetchSentTransactions: jest.fn(),
  fetchTransactionsByAddress: jest.fn(),
}));

jest.mock('@/context/WalletContext', () => ({
  useWalletContext: () => ({ supabaseClient: mockSupabaseClient }),
}));

import { fetchBucketBalances } from '@/lib/stellar/contract';
import { fetchSentTransactions, fetchTransactionsByAddress } from '@/lib/supabase';

const SENDER_ADDRESS = 'GBZXN7PIRZGNMHGA7MUUUF4GWUQESTCDVWAYQOTNCFYMZ7GF3VG7DKIW';
const RECEIVER_ADDRESS = 'GDXKVV5BGBDRNSJDCZAEX3XMXWD6Z2WBCHBCT55ZFWG6R2RL5MMTZR3Y';

describe('useBucketHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default empty state', () => {
    (fetchSentTransactions as jest.Mock).mockResolvedValue([]);
    const { result } = renderHook(() => useBucketHistory(null));

    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads and joins bucket history successfully', async () => {
    const mockDeposits = [
      {
        tx_hash: 'deposit-tx-hash',
        type: 'deposit',
        sender_address: SENDER_ADDRESS,
        receiver_address: RECEIVER_ADDRESS,
        amount: 100,
        split_ratio: 60,
        unlock_date: 1800000000,
        created_at: '2026-07-14T12:00:00Z',
      },
    ];

    const mockOnChainBalances = [
      {
        id: 0,
        sender: SENDER_ADDRESS,
        spendingBalance: 60,
        goalBalance: 40,
        unlockDate: 1800000000,
      },
    ];

    const mockWithdrawals = [
      {
        tx_hash: 'withdrawal-tx-hash',
        type: 'withdraw_goal',
        sender_address: RECEIVER_ADDRESS,
        receiver_address: RECEIVER_ADDRESS,
        amount: 40,
        unlock_date: 1800000000,
        created_at: '2026-07-14T14:00:00Z',
      },
    ];

    (fetchSentTransactions as jest.Mock).mockResolvedValue(mockDeposits);
    (fetchBucketBalances as jest.Mock).mockResolvedValue(mockOnChainBalances);
    (fetchTransactionsByAddress as jest.Mock).mockResolvedValue(mockWithdrawals);

    const { result } = renderHook(() => useBucketHistory(SENDER_ADDRESS));

    // Wait for async hook effects
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchSentTransactions).toHaveBeenCalledWith(SENDER_ADDRESS, mockSupabaseClient);
    expect(fetchBucketBalances).toHaveBeenCalledWith(RECEIVER_ADDRESS);
    expect(fetchTransactionsByAddress).toHaveBeenCalledWith(RECEIVER_ADDRESS, mockSupabaseClient);

    expect(result.current.entries.length).toBe(1);
    const entry = result.current.entries[0];
    expect(entry.receiverAddress).toBe(RECEIVER_ADDRESS);
    expect(entry.depositAmount).toBe(100);
    expect(entry.spendingAmount).toBe(60);
    expect(entry.goalAmount).toBe(40);
    expect(entry.liveGoalBalance).toBe(40);
    expect(entry.goalWithdrawalTxHash).toBe('withdrawal-tx-hash');
  });
});
