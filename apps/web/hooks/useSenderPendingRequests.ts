import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSenderPendingRequests, EmergencyRequestRow } from '@/lib/supabase';

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
      setSenderPendingRequests(reqs);
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
