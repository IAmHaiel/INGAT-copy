import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SenderBucketCard from '@/components/ui/dashboard/SenderBucketCard';

// Mock useXlmPrice hook
jest.mock('@/hooks/useXlmPrice', () => ({
  useXlmPrice: () => ({ priceUsd: 0.15, loading: false }),
}));

describe('SenderBucketCard', () => {
  const mockProps = {
    id: 0,
    receiverAddress: 'GDXKVV5BGBDRNSJDCZAEX3XMXWD6Z2WBCHBCT55ZFWG6R2RL5MMTZR3Y',
    spendingBalance: 50,
    goalBalance: 100,
    unlockDate: Math.floor(Date.now() / 1000) + 86400, // 1 day in the future
    onWithdrawGoal: jest.fn(),
    isWithdrawing: false,
  };

  it('renders locked bucket correctly', () => {
    render(<SenderBucketCard {...mockProps} />);

    expect(screen.getByTitle(mockProps.receiverAddress)).toBeInTheDocument();
    expect(screen.getByText('100.00 XLM')).toBeInTheDocument();
    expect(screen.getByText('50.00 XLM')).toBeInTheDocument();
    expect(screen.getByText(/Goal locked:/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reclaim Savings/i })).not.toBeInTheDocument();
  });

  it('renders unlocked bucket with Reclaim button', () => {
    const unlockedProps = {
      ...mockProps,
      unlockDate: Math.floor(Date.now() / 1000) - 100, // past
    };

    render(<SenderBucketCard {...unlockedProps} />);

    expect(screen.getByText('Goal Unlocked')).toBeInTheDocument();
    const reclaimBtn = screen.getByRole('button', { name: /Reclaim Savings/i });
    expect(reclaimBtn).toBeInTheDocument();
    expect(reclaimBtn).not.toBeDisabled();

    // Click reclaim savings to open the form
    fireEvent.click(reclaimBtn);

    // Now the form is open, we can see "Confirm Reclaim" button and amount input
    const confirmBtn = screen.getByRole('button', { name: /Confirm Reclaim/i });
    expect(confirmBtn).toBeInTheDocument();
    expect(confirmBtn).toBeDisabled(); // disabled because amount is empty initially

    const input = screen.getByPlaceholderText('Amount to reclaim');
    fireEvent.change(input, { target: { value: '50' } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(mockProps.onWithdrawGoal).toHaveBeenCalledWith(mockProps.receiverAddress, mockProps.id, 50);
  });

  it('disables reclaim savings button when isWithdrawing is true', () => {
    const unlockedProps = {
      ...mockProps,
      unlockDate: Math.floor(Date.now() / 1000) - 100, // past
      isWithdrawing: true,
    };

    render(<SenderBucketCard {...unlockedProps} />);

    const reclaimBtn = screen.getByRole('button', { name: /Reclaim Savings/i });
    expect(reclaimBtn).toBeDisabled();
  });
});
