import { useState, useEffect, useCallback } from 'react';
import { fetchBucketBalances } from '@/lib/stellar/contract';
import { fetchDepositEvents } from '@/lib/stellar/contract/events';

interface PendingRequest {
  receiver_address: string;
  bucket_id: number;
  amount: number;
  cooldown_ends_at: number;
}

export const useSenderPendingRequests = (
  senderAddress: string | null,
  intervalMs = 15000
) => {
  const [senderPendingRequests, setSenderPendingRequests] = useState<PendingRequest[]>([]);

  const fetchSenderPendingRequests = useCallback(async () => {
    if (!senderAddress) return;
    try {
      const events = await fetchDepositEvents(senderAddress);
      const uniqueReceivers = Array.from(new Set(events.map((e) => e.receiver)));

      const pending: PendingRequest[] = [];

      await Promise.all(
        uniqueReceivers.map(async (receiver) => {
          try {
            const buckets = await fetchBucketBalances(receiver);
            for (const bucket of buckets) {
              if (bucket.emergencyRequest && bucket.emergencyRequest.status === 'Pending') {
                pending.push({
                  receiver_address: receiver,
                  bucket_id: bucket.id,
                  amount: bucket.emergencyRequest.amount,
                  cooldown_ends_at: bucket.emergencyRequest.cooldownEndsAt,
                });
              }
            }
          } catch {
            // Skip receivers we can't reach
          }
        })
      );

      setSenderPendingRequests(pending);
    } catch (err) {
      console.error('Failed to fetch sender pending requests:', err);
    }
  }, [senderAddress]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSenderPendingRequests();
    }, 0);
    const interval = setInterval(fetchSenderPendingRequests, intervalMs);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchSenderPendingRequests, intervalMs]);

  return {
    senderPendingRequests,
    refreshSenderPendingRequests: fetchSenderPendingRequests,
  };
};
