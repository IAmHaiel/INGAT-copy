import React, { useState, useEffect } from 'react';
import { formatAmount, formatDate, formatDistanceToNow, truncateAddress } from '@/lib/utils/format';
import { Lock, Unlock, Calendar, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';
import { EmergencyRequest } from '@/types/emergency';
import { CooldownBanner } from '../emergency/CooldownBanner';
import { RequestEarlyAccessModal } from '../emergency/RequestEarlyAccessModal';
import { getContactName } from '@/lib/utils/contacts';

import { ReleaseRequest } from '@/types/bucket';
import { buildRequestReleaseTx, submitTransaction } from '@/lib/stellar/contract';
import { fetchReleaseRequest, fetchBucketBalances } from '@/lib/stellar/contract/queries';
import { signTxWithFreighter } from '@/lib/stellar/freighter';
import { useWalletContext } from '@/context/WalletContext';
import { toast } from 'sonner';

interface GoalBucketCardProps {
  bucketId: number;
  balance: number;
  unlockDate: number; // unix timestamp in seconds
  goalLabel?: string | null;
  senderAddress: string;
  receiverAddress: string | null;
  onWithdraw: (amount: number) => void;
  isWithdrawing: boolean;
  emergencyRequest?: EmergencyRequest | null;
  onRequestEmergency?: (amount: number) => void;
  onCancelEmergency?: () => void;
  onExecuteEmergency?: () => void;
  isEmergencyLoading?: boolean;
  approvalRequired?: boolean;
  releaseRequest?: ReleaseRequest | null;
  onRequestRelease?: () => void;
  isReleaseLoading?: boolean;
}

const GoalBucketCard: React.FC<GoalBucketCardProps> = ({
  bucketId,
  balance,
  unlockDate,
  goalLabel,
  senderAddress,
  receiverAddress,
  onWithdraw,
  isWithdrawing,
  emergencyRequest = null,
  onRequestEmergency,
  onCancelEmergency,
  onExecuteEmergency,
  isEmergencyLoading = false,
  approvalRequired = false,
  releaseRequest = null,
  onRequestRelease,
  isReleaseLoading = false,
}) => {
  const [amount, setAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState<number>(0);
  const { priceUsd } = useXlmPrice();
  const contactName = getContactName(senderAddress);

  useEffect(() => {
    const checkLock = () => {
      const now = Math.floor(Date.now() / 1000);
      setIsLocked(now < unlockDate);
      setTimeLeftStr(formatDistanceToNow(unlockDate));

      // Calculate re-request cooldown (1 hour / 3600 seconds)
      let maxCancelAt = 0;
      if (emergencyRequest && emergencyRequest.status === 'Cancelled' && emergencyRequest.lastCancelAt) {
        maxCancelAt = Math.max(maxCancelAt, emergencyRequest.lastCancelAt);
      }
      if (typeof window !== 'undefined' && receiverAddress) {
        const localVal = localStorage.getItem(`cooldown_cancel_${receiverAddress}_${bucketId}`);
        if (localVal) {
          maxCancelAt = Math.max(maxCancelAt, parseInt(localVal, 10));
        }
      }

      const cooldownEnds = maxCancelAt + 3600;
      const timeLeft = Math.max(0, cooldownEnds - now);
      setCooldownTimeLeft(timeLeft);
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [unlockDate, emergencyRequest, receiverAddress, bucketId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!isNaN(parsed) && parsed > 0 && parsed <= balance) {
      onWithdraw(parsed);
      setAmount('');
      setIsOpen(false);
    }
  };

  const handleRequestConfirm = (reqAmount: number) => {
    if (onRequestEmergency) {
      onRequestEmergency(reqAmount);
    }
    setIsModalOpen(false);
  };

  const hasBalance = balance > 0;
  const isEmergencyPending = emergencyRequest && emergencyRequest.status === 'Pending';

  // Direct contract reads — bypasses the broken prop pipeline
  const { publicKey } = useWalletContext();
  const [localReleaseLoading, setLocalReleaseLoading] = useState(false);
  const [localReleaseStatus, setLocalReleaseStatus] = useState<'Pending' | 'Approved' | 'Executed' | null>(null);
  const [localApprovalRequired, setLocalApprovalRequired] = useState(false);
  // On mount, read approval_required directly from the contract
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const buckets = await fetchBucketBalances(receiverAddress || '');
        const mine = buckets.find(b => b.id === bucketId);
        if (active && mine) setLocalApprovalRequired(mine.approvalRequired);
      } catch {}
    })();
    return () => { active = false; };
  }, [receiverAddress, bucketId]);
  // Poll release request status from contract directly
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const req = await fetchReleaseRequest(receiverAddress || '', bucketId);
        if (active && req) setLocalReleaseStatus(req.status as 'Pending' | 'Approved' | 'Executed');
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [receiverAddress, bucketId]);
  const handleRequestReleaseLocal = async () => {
    if (!publicKey) return;
    setLocalReleaseLoading(true);
    try {
      const unsignedXDR = await buildRequestReleaseTx(publicKey, bucketId);
      const signedXDR = await signTxWithFreighter(unsignedXDR, publicKey);
      await submitTransaction(signedXDR);
      setLocalReleaseStatus('Pending');
      toast.success('Release Requested', {
        description: 'Sender can now approve. Auto-releases after 7 days if no response.',
        duration: 5000,
      });
    } catch (err) {
      toast.error('Release Request Failed', {
        description: err instanceof Error ? err.message : 'Transaction failed',
        duration: 5000,
      });
    } finally {
      setLocalReleaseLoading(false);
    }
  };

  // NOTE: approvalRequired prop from the data pipeline is unreliable — it arrives as `false`
  // even though the contract returns `true`. This is a React state management issue where
  // bucket data loses field values between fetchBucketBalances and this component.
  // Hardcoding true for Phase 4; TimeOnly buckets get a functionless "Request Release" button
  // (contract rejects with BucketNotTimeAndApproval). This keeps the core feature working.
  // True source of approval mode: fetched directly from contract on mount.
  // Falls back to the prop value (which may be unreliable) if contract fetch hasn't completed yet.
  const effectiveApprovalRequired = localApprovalRequired || approvalRequired;

  return (
    <div className={`p-5 rounded-xl border shadow-md space-y-4 transition-all ${isLocked ? 'bg-amber-50/40 border-amber-200/50' : 'bg-white border-outline-variant'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full flex items-center justify-center ${isLocked ? 'bg-secondary/10 text-secondary' : 'bg-green-50 text-green-600'}`}>
            {isLocked ? <Lock size={24} /> : <Unlock size={24} />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface-variant">Goal Bucket</h3>
            <p className={`text-2xl font-black ${isLocked ? 'text-secondary' : 'text-green-600'}`}>
              {formatAmount(balance)} XLM
            </p>
            {priceUsd > 0 && balance > 0 && (
              <p className="text-xs text-on-surface-variant">{formatXlmWithUsd(balance, priceUsd)}</p>
            )}
          </div>
        </div>

        {hasBalance && !isEmergencyPending && (
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isLocked ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            <span>{isLocked ? timeLeftStr : 'Unlocked'}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-outline-variant/40 pt-3">
        {goalLabel && (
          <p className="text-xs font-semibold text-secondary italic">
            &ldquo;{goalLabel}&rdquo;
          </p>
        )}
        <p className="text-xs text-on-surface-variant">
          Funds are protected from impulse spending and locked on-chain.
        </p>
        <div className="flex flex-col gap-1">
          {unlockDate > 0 && (
            <div className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
              <Calendar size={14} />
              <span>Release Date: {formatDate(unlockDate)}</span>
            </div>
          )}
          <div className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
            <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary rounded-full">S</span>
            <span>Sender: </span>
            <span className="font-mono bg-surface-container px-2 py-0.5 rounded text-[10px] select-all align-middle" title={senderAddress}>
              {contactName ? `${contactName} (${truncateAddress(senderAddress)})` : truncateAddress(senderAddress)}
            </span>
          </div>
        </div>
      </div>

      {isEmergencyPending ? (
        <div className="pt-2">
          <CooldownBanner
            cooldownEndsAt={emergencyRequest.cooldownEndsAt}
            amount={emergencyRequest.amount}
            onCancel={onCancelEmergency}
            onExecute={onExecuteEmergency}
            role="receiver"
            isLoading={isEmergencyLoading}
          />
        </div>
      ) : isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-outline-variant animate-[fadeIn_150ms_ease-out]">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <input
                type="number"
                step="0.01"
                max={balance}
                placeholder="Amount to withdraw"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-outline-variant rounded-lg pl-3 pr-14 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 text-on-surface"
              />
              <button
                type="button"
                onClick={() => setAmount(balance.toFixed(2))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary hover:text-secondary/80 bg-transparent border-0 cursor-pointer"
              >
                MAX
              </button>
            </div>
            <button
              type="submit"
              disabled={isWithdrawing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              className="bg-secondary text-white font-bold text-sm px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 border-0 transition-opacity hover:opacity-90 w-full sm:w-auto flex items-center justify-center min-w-[90px]"
            >
              Withdraw
            </button>
          </div>

          <div className="space-y-1 min-h-[16px]">
            {amount && parseFloat(amount) > 0 && priceUsd > 0 && (
              <p className="text-[11px] text-on-surface-variant">
                USD Value: {formatXlmWithUsd(parseFloat(amount), priceUsd)}
              </p>
            )}
            {amount && parseFloat(amount) > 0 && parseFloat(amount) <= balance && (
              <p className="text-[11px] text-green-600 font-medium">
                Remaining: {formatAmount(balance - parseFloat(amount))} XLM
              </p>
            )}
            {amount && parseFloat(amount) > balance && (
              <p className="text-[11px] text-red-600 font-medium">
                Exceeds available balance of {formatAmount(balance)} XLM
              </p>
            )}
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setAmount('');
              }}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent py-1"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          {hasBalance && !isLocked && !effectiveApprovalRequired ? (
            // TimeOnly bucket past unlock_date — standard withdraw
            <button
              onClick={() => setIsOpen(true)}
              disabled={!hasBalance || isWithdrawing}
              className="w-full py-2.5 rounded-lg font-bold text-sm bg-green-50 hover:bg-green-100 text-green-700 transition-all cursor-pointer border-0"
            >
              {isWithdrawing ? 'Processing...' : 'Withdraw Unlocked Savings'}
            </button>
          ) : hasBalance && !isLocked && effectiveApprovalRequired && (releaseRequest?.status === 'Approved' || localReleaseStatus === 'Approved') ? (
            // TimeAndApproval bucket, release approved — withdraw
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                <ShieldCheck size={14} />
                Sender approved release — goal is unlocked
              </div>
              <button
                onClick={() => setIsOpen(true)}
                disabled={!hasBalance || isWithdrawing}
                className="w-full py-2.5 rounded-lg font-bold text-sm bg-teal-50 hover:bg-teal-100 text-teal-700 transition-all cursor-pointer border-0"
              >
                {isWithdrawing ? 'Processing...' : 'Withdraw Approved Release'}
              </button>
            </div>
          ) : (hasBalance && effectiveApprovalRequired && (releaseRequest?.status === 'Pending' || localReleaseStatus === 'Pending')) ? (
            // Release requested, awaiting sender approval
            <div className="w-full py-2.5 rounded-lg font-bold text-sm bg-amber-50 text-amber-700 border border-amber-200 text-center">
              Release requested — awaiting sender approval
            </div>
          ) : cooldownTimeLeft > 0 ? (
            <button
              disabled
              className="w-full py-2.5 rounded-lg font-bold text-sm bg-secondary-container/5 text-secondary/50 border border-secondary-container/10 flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <ShieldAlert size={16} />
              Cooldown Active ({Math.floor(cooldownTimeLeft / 60)}m {cooldownTimeLeft % 60}s)
            </button>
          ) : (
            <div className="space-y-2">
              {isLocked && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={!hasBalance || isEmergencyLoading}
                  className="w-full py-2.5 rounded-lg font-bold text-sm bg-secondary-container/10 text-secondary border border-secondary-container/20 hover:bg-secondary-container/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert size={16} />
                  Request Early Access
                </button>
              )}
              {hasBalance && !isLocked && (
                <button
                  onClick={handleRequestReleaseLocal}
                  disabled={localReleaseLoading}
                  className="w-full py-2.5 rounded-lg font-bold text-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert size={16} />
                  {localReleaseLoading ? 'Requesting...' : 'Request Release'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <RequestEarlyAccessModal
          bucket={{ id: bucketId, goalBalance: balance }}
          onConfirm={handleRequestConfirm}
          onClose={() => setIsModalOpen(false)}
          isLoading={isEmergencyLoading}
        />
      )}
    </div>
  );
};

export default GoalBucketCard;
