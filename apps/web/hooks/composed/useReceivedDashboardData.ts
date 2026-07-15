import { useBucketBalances } from '@/hooks/useBucketBalances';
import { useDashboardTransactions } from '@/hooks/useDashboardTransactions';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useEmergencyWithdrawal } from '@/hooks/useEmergencyWithdrawal';
import { toast } from 'sonner';

export const useReceivedDashboardData = (publicKey: string | null) => {
  const { balances: receivedBalances, isLoading: receivedBalancesLoading, error: receivedBalancesError, refreshBalances } = useBucketBalances(publicKey);
  const { receivedTransactions, isLoading: receivedHistoryLoading, refreshTransactions } = useDashboardTransactions(publicKey);

  const { withdraw: withdrawReceived, isWithdrawing: isReceiverWithdrawing, error: receiverWithdrawError, txHash: receiverTxHash } = useWithdraw(publicKey, () => {
    refreshBalances();
    refreshTransactions(true);
  });

  const {
    requestEmergency,
    cancelEmergencyReceiver,
    executeEmergency,
    isLoading: isReceiverEmergencyLoading,
    error: receiverEmergencyError,
  } = useEmergencyWithdrawal(publicKey, (action) => {
    refreshBalances();
    refreshTransactions(true);
    if (action === 'requested') {
      toast.success('Early Access Requested', {
        description: 'Emergency cooldown of 48 hours is now active.',
        duration: 5000
      });
    } else if (action === 'cancelled') {
      toast.success('Request Cancelled', {
        description: 'Emergency request has been successfully cancelled.',
        duration: 5000
      });
    } else if (action === 'executed') {
      toast.success('Early Access Withdrawal Executed', {
        description: 'Funds successfully withdrawn from Goal bucket.',
        duration: 5000
      });
    }
  });

  return {
    receivedBalances,
    receivedBalancesLoading,
    receivedBalancesError,
    refreshBalances,
    receivedTransactions,
    receivedHistoryLoading,
    refreshTransactions,
    withdrawReceived,
    isReceiverWithdrawing,
    receiverWithdrawError,
    receiverTxHash,
    requestEmergency,
    cancelEmergencyReceiver,
    executeEmergency,
    isReceiverEmergencyLoading,
    receiverEmergencyError,
  };
};
