import { useState, useEffect, useCallback } from 'react';
import { getSenderPendingRequests, EmergencyRequestRow, updateEmergencyRequestStatus } from '@/lib/supabase';
import { fetchBucketBalances } from '@/lib/stellar/contract';

export const useSenderPendingRequests = (
  senderAddress: string | null,
  supabaseClient: any | null,
  intervalMs = 5000
) => {
  const [senderPendingRequests, setSenderPendingRequests] = useState<EmergencyRequestRow[]>([]);

  const fetchSenderPendingRequests = useCallback(async () => {
    if (!supabaseClient || !senderAddress) return;
    try {
      const reqs = await getSenderPendingRequests(senderAddress, supabaseClient);

      // Validate each pending request against on-chain state.
      // If the bucket doesn't exist on the current contract, auto-dismiss it.
      const uniqueReceivers = Array.from(new Set(reqs.map((r) => r.receiver_address)));
      const receiverBucketsMap = new Map<string, number[]>();

      await Promise.all(
        uniqueReceivers.map(async (receiver) => {
          try {
            const buckets = await fetchBucketBalances(receiver);
            receiverBucketsMap.set(receiver, buckets.map((b) => b.id));
          } catch {
            // If we can't fetch, keep the request visible (don't dismiss on network error)
            receiverBucketsMap.set(receiver, reqs.filter((r) => r.receiver_address === receiver).map((r) => r.bucket_id));
          }
        })
      );

      const validReqs: EmergencyRequestRow[] = [];
      const staleReqs: EmergencyRequestRow[] = [];

      for (const req of reqs) {
        const validBucketIds = receiverBucketsMap.get(req.receiver_address) || [];
        if (validBucketIds.includes(req.bucket_id)) {
          validReqs.push(req);
        } else {
          staleReqs.push(req);
        }
      }

      // Auto-dismiss stale requests in background
      for (const stale of staleReqs) {
        await updateEmergencyRequestStatus(stale.tx_hash, 'cancelled', 'stale_dismissed', supabaseClient).catch(() => {});
      }

      setSenderPendingRequests(validReqs);
    } catch (err) {
      console.error('Failed to fetch sender pending requests:', err);
    }
  }, [senderAddress, supabaseClient]);

  useEffect(() => {
    fetchSenderPendingRequests();
    const interval = setInterval(fetchSenderPendingRequests, intervalMs);
    return () => clearInterval(interval);
  }, [fetchSenderPendingRequests, intervalMs]);

  return {
    senderPendingRequests,
    refreshSenderPendingRequests: fetchSenderPendingRequests,
  };
};
