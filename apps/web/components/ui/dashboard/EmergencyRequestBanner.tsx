import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { EmergencyRequestRow } from '@/lib/supabase';
import { formatAmount } from '@/lib/utils/format';

interface EmergencyRequestBannerProps {
  requests: EmergencyRequestRow[];
  onCancel: (receiverAddress: string, bucketId: number, txHash: string) => void;
  isLoading: boolean;
}

export default function EmergencyRequestBanner({
  requests,
  onCancel,
  isLoading,
}: EmergencyRequestBannerProps) {
  if (requests.length === 0) return null;

  return (
    <>
      {requests.map((req) => (
        <div
          key={req.tx_hash}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-[slideIn_200ms_ease-out]"
        >
          <div className="flex gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 flex items-center justify-center">
              <ShieldAlert size={20} className="animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Receiver Requested Early Access (Bucket #{req.bucket_id + 1})
              </p>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Receiver has requested early withdrawal of <strong className="text-amber-950 font-extrabold">{formatAmount(req.amount)} XLM</strong> from Bucket #{req.bucket_id + 1}. A 48-hour cooldown is active.
              </p>
            </div>
          </div>
          <button
            onClick={() => onCancel(req.receiver_address, req.bucket_id, req.tx_hash)}
            disabled={isLoading}
            className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer border-0 shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Request'}
          </button>
        </div>
      ))}
    </>
  );
}
