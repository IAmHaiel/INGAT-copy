import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, Ban, CheckCircle2 } from 'lucide-react';
import { BucketState } from '@/types/bucket';
import { formatAmount, truncateAddress } from '@/lib/utils/format';
import { getContactName } from '@/lib/utils/contacts';

interface PendingRequest {
  receiver_address: string;
  bucket_id: number;
  amount: number;
  cooldown_ends_at: number;
}

interface EarlyAccessViewProps {
  senderPendingRequests: PendingRequest[];
  onSenderCancel: (receiverAddress: string, bucketId: number) => void;
  isSenderCancelLoading: boolean;
  getGoalLabel?: (receiverAddress: string, bucketId: number) => string | null;

  receivedBalances: BucketState[];
  onReceiverCancel: (bucketId: number) => void;
  onReceiverExecute: (bucketId: number, amount: number) => void;
  isReceiverEmergencyLoading: boolean;
  getReceivedGoalLabel?: (senderAddress: string, unlockDate: number) => string | null;
}

export default function EarlyAccessView({
  senderPendingRequests,
  onSenderCancel,
  isSenderCancelLoading,
  getGoalLabel,
  receivedBalances,
  onReceiverCancel,
  onReceiverExecute,
  isReceiverEmergencyLoading,
  getReceivedGoalLabel,
}: EarlyAccessViewProps) {
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (endsAt: number) => {
    if (now === 0) return 'Calculating...';
    const diff = endsAt - now;
    if (diff <= 0) return 'Cooldown Complete';
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours}h ${minutes}m ${seconds}s remaining`;
  };

  const activeReceivedRequests = receivedBalances.filter(
    (b) => b.emergencyRequest && b.emergencyRequest.status === 'Pending'
  );

  return (
    <div className="flex flex-col h-[calc(100vh-18rem)] min-h-[480px] bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden animate-[fadeIn_150ms_ease-out]">
      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-outline-variant bg-surface-container/10 p-2 gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all border-0 ${
            activeTab === 'incoming'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'hover:bg-surface-container text-on-surface-variant'
          }`}
        >
          <ShieldAlert size={14} />
          Incoming Requests
          {senderPendingRequests.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'incoming' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'}`}>
              {senderPendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all border-0 ${
            activeTab === 'outgoing'
              ? 'bg-secondary text-white shadow-sm'
              : 'hover:bg-surface-container text-on-surface-variant'
          }`}
        >
          <Clock size={14} />
          Outgoing Requests
          {activeReceivedRequests.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'outgoing' ? 'bg-white text-secondary' : 'bg-secondary/10 text-secondary'}`}>
              {activeReceivedRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-grow overflow-y-auto p-6">
        {activeTab === 'incoming' ? (
          <div className="h-full">
            {senderPendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 bg-surface-container/20 rounded-xl border border-dashed border-outline-variant p-4">
                <p className="text-on-surface-variant font-medium text-xs">No incoming early access requests</p>
                <p className="text-on-surface-variant text-[10px] mt-0.5">When your receivers request emergency access, they will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {senderPendingRequests.map((req) => {
                  const isCooldownDone = now >= req.cooldown_ends_at;
                  return (
                    <div key={`${req.receiver_address}_${req.bucket_id}`} className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 flex flex-col justify-between gap-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Bucket #{req.bucket_id + 1}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-amber-900 font-bold bg-amber-100/50 px-2 py-0.5 rounded-md">
                            <Clock size={12} />
                            <span>{formatCountdown(req.cooldown_ends_at)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-on-surface-variant">Receiver:</p>
                          <p className="text-[11px] font-mono bg-white border border-outline-variant px-2 py-1 rounded truncate select-all" title={req.receiver_address}>
                            {getContactName(req.receiver_address) ? `${getContactName(req.receiver_address)} (${truncateAddress(req.receiver_address)})` : truncateAddress(req.receiver_address)}
                          </p>
                        </div>
                        {getGoalLabel && getGoalLabel(req.receiver_address, req.bucket_id) && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100/50 border border-amber-200/30 rounded-lg">
                            <span className="text-[10px] text-secondary font-semibold">Goal:</span>
                            <span className="text-[10px] text-on-surface italic">&ldquo;{getGoalLabel(req.receiver_address, req.bucket_id)}&rdquo;</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center bg-white border border-amber-100 rounded-lg p-2.5">
                          <span className="text-[11px] text-on-surface-variant font-medium">Requested Amount:</span>
                          <span className="text-xs font-black text-amber-950">{formatAmount(req.amount)} XLM</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onSenderCancel(req.receiver_address, req.bucket_id)}
                        disabled={isSenderCancelLoading || isCooldownDone}
                        className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-amber-200 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer border-0 shadow-sm flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
                      >
                        <Ban size={14} />
                        {isSenderCancelLoading ? 'Cancelling...' : isCooldownDone ? 'Cooldown Complete' : 'Cancel Early Access Request'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full">
            {activeReceivedRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 bg-surface-container/20 rounded-xl border border-dashed border-outline-variant p-4">
                <p className="text-on-surface-variant font-medium text-xs">No outgoing emergency requests active</p>
                <p className="text-on-surface-variant text-[10px] mt-0.5">When you request early access to goals, the cooldown status will track here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeReceivedRequests.map((bucket) => {
                  if (!bucket.emergencyRequest) return null;
                  const isCooldownDone = now >= bucket.emergencyRequest.cooldownEndsAt;
                  return (
                    <div key={bucket.id} className="border border-outline-variant bg-surface-container/10 rounded-xl p-4 flex flex-col justify-between gap-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Bucket #{bucket.id + 1}
                          </span>
                          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isCooldownDone ? 'bg-green-100 text-green-800' : 'bg-secondary/10 text-secondary'
                          }`}>
                            <Clock size={12} />
                            <span>{formatCountdown(bucket.emergencyRequest.cooldownEndsAt)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-on-surface-variant">Sender:</p>
                          <p className="text-[11px] font-mono bg-white border border-outline-variant px-2 py-1 rounded truncate select-all" title={bucket.sender}>
                            {getContactName(bucket.sender) ? `${getContactName(bucket.sender)} (${truncateAddress(bucket.sender)})` : truncateAddress(bucket.sender)}
                          </p>
                        </div>
                        {getReceivedGoalLabel && getReceivedGoalLabel(bucket.sender, bucket.unlockDate) && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/5 border border-secondary-container/10 rounded-lg">
                            <span className="text-[10px] text-secondary font-semibold">Goal:</span>
                            <span className="text-[10px] text-on-surface italic">&ldquo;{getReceivedGoalLabel(bucket.sender, bucket.unlockDate)}&rdquo;</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center bg-white border border-outline-variant rounded-lg p-2.5">
                          <span className="text-[11px] text-on-surface-variant font-medium">Requested Amount:</span>
                          <span className="text-xs font-black text-on-surface">{formatAmount(bucket.emergencyRequest.amount)} XLM</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onReceiverCancel(bucket.id)}
                          disabled={isReceiverEmergencyLoading}
                          className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-xs py-2 px-3 rounded-lg border border-outline-variant transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel Request
                        </button>
                        <button
                          onClick={() => onReceiverExecute(bucket.id, bucket.emergencyRequest!.amount)}
                          disabled={isReceiverEmergencyLoading || !isCooldownDone}
                          className="flex-1 bg-secondary text-white font-bold text-xs py-2 px-3 rounded-lg transition-all active:scale-95 disabled:bg-secondary/35 cursor-pointer border-0 shadow-sm flex items-center justify-center gap-1 disabled:cursor-not-allowed disabled:scale-100"
                        >
                          <CheckCircle2 size={14} />
                          Execute
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
