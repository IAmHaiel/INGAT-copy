import { renderHook, act } from '@testing-library/react';
import { useBucketHistory } from '@/hooks/useBucketHistory';

// Mock dependencies
jest.mock('@/lib/stellar/contract', () => ({
  fetchBucketBalances: jest.fn(),
}));

jest.mock('@/lib/stellar/contract/events', () => ({
  fetchDepositEvents: jest.fn(),
  fetchReceivedDepositEvents: jest.fn(),
}));

import { fetchBucketBalances } from '@/lib/stellar/contract';
import { fetchDepositEvents } from '@/lib/stellar/contract/events';

const SENDER_ADDRESS = 'GBZXN7PIRZGNMHGA7MUUUF4GWUQESTCDVWAYQOTNCFYMZ7GF3VG7DKIW';
const RECEIVER_ADDRESS = 'GDXKVV5BGBDRNSJDCZAEX3XMXWD6Z2WBCHBCT55ZFWG6R2RL5MMTZR3Y';

describe('useBucketHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default empty state', () => {
    const { result } = renderHook(() => useBucketHistory(null));

    expect(result.current.entries).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads and joins bucket history successfully', async () => {
    const mockDeposits = [
      {
        id: 'deposit-tx-hash',
        sender: SENDER_ADDRESS,
        receiver: RECEIVER_ADDRESS,
        amount: 100,
        splitRatio: 60,
        unlockDate: 1800000000,
        timestamp: 1750000000,
        goalLabel: null,
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

    (fetchDepositEvents as jest.Mock).mockResolvedValue(mockDeposits);
    (fetchBucketBalances as jest.Mock).mockResolvedValue(mockOnChainBalances);

    const { result } = renderHook(() => useBucketHistory(SENDER_ADDRESS));

    // Wait for async hook effects
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchDepositEvents).toHaveBeenCalledWith(SENDER_ADDRESS);
    expect(fetchBucketBalances).toHaveBeenCalledWith(RECEIVER_ADDRESS);

    expect(result.current.entries.length).toBe(1);
    const entry = result.current.entries[0];
    expect(entry.receiverAddress).toBe(RECEIVER_ADDRESS);
    expect(entry.depositAmount).toBe(100);
    expect(entry.spendingAmount).toBe(60);
    expect(entry.goalAmount).toBe(40);
    expect(entry.liveGoalBalance).toBe(40);
  });
});
