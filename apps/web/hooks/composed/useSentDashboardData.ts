import { useAllocationHistory } from '@/hooks/useAllocationHistory';
import { useSenderBuckets } from '@/hooks/useSenderBuckets';
import { useSenderCancelEmergency } from '@/hooks/useSenderCancelEmergency';
import { useSenderPendingRequests } from '@/hooks/useSenderPendingRequests';
import { toast } from 'sonner';
import { SupabaseClient } from '@supabase/supabase-js';

export const useSentDashboardData = (publicKey: string | null, supabaseClient: SupabaseClient | null) => {
  const { allocations: sentAllocations, isLoading: sentHistoryLoading, refreshHistory: refreshSentHistory } = useAllocationHistory(publicKey);
  const {
    buckets: sentBuckets,
    isLoading: sentBucketsLoading,
    error: sentBucketsError,
    withdrawSenderGoal,
    isWithdrawing: isSenderWithdrawing,
    withdrawError: senderWithdrawError,
    txHash: senderTxHash,
    refreshBuckets,
  } = useSenderBuckets(publicKey);

  const {
    senderPendingRequests,
    refreshSenderPendingRequests,
  } = useSenderPendingRequests(publicKey, supabaseClient);

  const {
    cancelEmergency: senderCancelEmergency,
    isLoading: isSenderEmergencyLoading,
    error: senderEmergencyError,
  } = useSenderCancelEmergency(publicKey, () => {
    refreshSentHistory();
    refreshBuckets(true);
    refreshSenderPendingRequests();
    toast.success('Early Access Request Cancelled', {
      description: 'The emergency withdrawal request has been successfully cancelled.',
      duration: 5000
    });
  });

  return {
    sentAllocations,
    sentHistoryLoading,
    refreshSentHistory,
    sentBuckets,
    sentBucketsLoading,
    sentBucketsError,
    withdrawSenderGoal,
    isSenderWithdrawing,
    senderWithdrawError,
    senderTxHash,
    refreshBuckets,
    senderPendingRequests,
    refreshSenderPendingRequests,
    senderCancelEmergency,
    isSenderEmergencyLoading,
    senderEmergencyError,
  };
};
