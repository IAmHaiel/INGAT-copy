import React, { useState, useEffect } from 'react';
import { formatAmount, formatDate, formatDistanceToNow, truncateAddress } from '@/lib/utils/format';
import { Lock, Unlock, Calendar, ArrowUpRight, Coins, ShieldCheck } from 'lucide-react';
import { useXlmPrice } from '@/hooks/useXlmPrice';
import { formatXlmWithUsd } from '@/lib/utils/price';
import { EmergencyRequest } from '@/types/emergency';
import { ReleaseRequest } from '@/types/bucket';
import { fetchReleaseRequest } from '@/lib/stellar/contract/queries';
import { buildApproveReleaseTx, submitTransaction } from '@/lib/stellar/contract';
import { signTxWithFreighter } from '@/lib/stellar/freighter';
import { useWalletContext } from '@/context/WalletContext';
import { toast } from 'sonner';
import { CooldownBanner } from '../emergency/CooldownBanner';
import { getContactName } from '@/lib/utils/contacts';

interface SenderBucketCardProps {
  id: number;
  receiverAddress: string;
  spendingBalance: number;
  goalBalance: number;
  unlockDate: number;
  goalLabel?: string | null;
  onWithdrawGoal: (receiverAddress: string, bucketId: number, amount: number) => void;
  isWithdrawing: boolean;
  emergencyRequest?: EmergencyRequest | null;
  onCancelEmergency?: (receiverAddress: string, bucketId: number) => void;
  isEmergencyLoading?: boolean;
  approvalRequired?: boolean;
  releaseRequest?: ReleaseRequest | null;
  onApproveRelease?: (receiverAddress: string, bucketId: number) => void;
  isReleaseLoading?: boolean;
}

const SenderBucketCard: React.FC<SenderBucketCardProps> = ({
  id,
  receiverAddress,
  spendingBalance,
  goalBalance,
  unlockDate,
  goalLabel,
  onWithdrawGoal,
  isWithdrawing,
  emergencyRequest = null,
  onCancelEmergency,
  isEmergencyLoading = false,
  approvalRequired = false,
  releaseRequest = null,
  onApproveRelease,
  isReleaseLoading = false,
}) => {
  const [amount, setAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const { priceUsd } = useXlmPrice();
  const { publicKey } = useWalletContext();
  const [localReleaseReq, setLocalReleaseReq] = useState<ReleaseRequest | null | undefined>(undefined);
  const [localApproving, setLocalApproving] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const req = await fetchReleaseRequest(receiverAddress, id);
        if (active) setLocalReleaseReq(req);
      } catch {
        if (active) setLocalReleaseReq(undefined);
      }
    })();
    const interval = setInterval(async () => {
      try {
        const req = await fetchReleaseRequest(receiverAddress, id);
        if (active) setLocalReleaseReq(req);
      } catch {
        if (active) setLocalReleaseReq(undefined);
      }
    }, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [receiverAddress, id]);
  const handleApproveReleaseLocal = async () => {
    if (!publicKey) return;
    setLocalApproving(true);
    try {
      const unsignedXDR = await buildApproveReleaseTx(publicKey, receiverAddress, id);
      const signedXDR = await signTxWithFreighter(unsignedXDR, publicKey);
      await submitTransaction(signedXDR);
      toast.success('Release Approved', {
        description: 'Successfully approved goal bucket release.',
        duration: 5000,
      });
      setLocalReleaseReq({ ...localReleaseReq!, status: 'Approved' } as ReleaseRequest);
    } catch (err) {
      toast.error('Approval Failed', {
        description: err instanceof Error ? err.message : 'Failed to approve release',
        duration: 5000,
      });
    } finally {
      setLocalApproving(false);
    }
  };

  useEffect(() => {
    const checkLock = () => {
      const now = Math.floor(Date.now() / 1000);
      setIsLocked(now < unlockDate);
      setTimeLeftStr(formatDistanceToNow(unlockDate));
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [unlockDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!isNaN(parsed) && parsed > 0 && parsed <= goalBalance) {
      onWithdrawGoal(receiverAddress, id, parsed);
      setAmount('');
      setIsOpen(false);
    }
  };

  const contactName = getContactName(receiverAddress);
  const hasGoalBalance = goalBalance > 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant pb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
            Bucket #{id + 1}
          </span>
          <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
            Receiver: 
            <span className="inline-block max-w-[130px] sm:max-w-none truncate font-mono bg-surface-container px-2 py-0.5 rounded text-[11px] select-all align-middle" title={receiverAddress}>
              {contactName ? `${contactName} (${truncateAddress(receiverAddress)})` : truncateAddress(receiverAddress)}
            </span>
          </span>
        </div>

        {hasGoalBalance && (
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-auto ${isLocked ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            <span>{isLocked ? `Goal locked: ${timeLeftStr}` : 'Goal Unlocked'}</span>
          </div>
        )}
      </div>

      {goalLabel && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/60 border border-amber-200/40 rounded-lg">
          <span className="text-xs text-secondary font-semibold">Goal:</span>
          <span className="text-xs text-on-surface italic">&ldquo;{goalLabel}&rdquo;</span>
        </div>
      )}

      {emergencyRequest && emergencyRequest.status === 'Pending' && (
        <div className="mt-2">
          <CooldownBanner
            cooldownEndsAt={emergencyRequest.cooldownEndsAt}
            amount={emergencyRequest.amount}
            onCancel={onCancelEmergency ? () => onCancelEmergency(receiverAddress, id) : undefined}
            role="sender"
            isLoading={isEmergencyLoading}
          />
        </div>
      )}

      {hasGoalBalance && localReleaseReq?.status === 'Pending' && (
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/50 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-600" />
            <p className="text-xs font-bold text-amber-800">Release Requested</p>
          </div>
          <p className="text-[11px] text-amber-700">
            The receiver has requested early release of the goal bucket. Funds will auto-release after{' '}
            {localReleaseReq.gracePeriodEndsAt > 0
              ? formatDistanceToNow(localReleaseReq.gracePeriodEndsAt)
              : 'the grace period'}{' '}
            if you don&apos;t respond.
          </p>
          <button
            onClick={handleApproveReleaseLocal}
            disabled={localApproving}
            className="bg-primary text-white font-bold text-xs py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50 border-0"
          >
            {localApproving ? 'Approving...' : 'Approve Release'}
          </button>
        </div>
      )}

      {localReleaseReq?.status === 'Approved' && (
        <div className="bg-green-50 p-3 rounded-xl border border-green-200">
          <p className="text-xs font-bold text-green-800 flex items-center gap-1.5">
            <ShieldCheck size={16} />
            Release Approved
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spending Split */}
        <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
              <Coins size={14} className="text-primary" />
              Spending split
            </h4>
            <span className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-medium">
              Receiver has full access
            </span>
          </div>
          <div>
            <p className="text-xl font-black text-primary">
              {formatAmount(spendingBalance)} XLM
            </p>
            {priceUsd > 0 && spendingBalance > 0 && (
              <p className="text-xs text-on-surface-variant">{formatXlmWithUsd(spendingBalance, priceUsd)}</p>
            )}
          </div>
        </div>

        {/* Goal Split */}
        <div className={`p-4 rounded-xl border space-y-2 ${isLocked ? 'bg-amber-50/20 border-amber-200/40' : 'bg-white border-outline-variant/60'}`}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
              {isLocked ? <Lock size={14} className="text-secondary" /> : <Unlock size={14} className="text-green-600" />}
              Goal split
            </h4>
            {unlockDate > 0 && (
              <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                <Calendar size={12} />
                Release: {formatDate(unlockDate)}
              </span>
            )}
          </div>
          <div>
            <p className={`text-xl font-black ${isLocked ? 'text-secondary' : 'text-green-600'}`}>
              {formatAmount(goalBalance)} XLM
            </p>
            {priceUsd > 0 && goalBalance > 0 && (
              <p className="text-xs text-on-surface-variant">{formatXlmWithUsd(goalBalance, priceUsd)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Goal Post-Maturity Reclamation Option */}
      {hasGoalBalance && !isLocked && (
        <div className="pt-2 border-t border-outline-variant/60">
          {isOpen ? (
            <form onSubmit={handleSubmit} className="space-y-3 pt-1 animate-[fadeIn_150ms_ease-out]">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <input
                    type="number"
                    step="0.01"
                    max={goalBalance}
                    placeholder="Amount to reclaim"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white border border-outline-variant rounded-lg pl-3 pr-14 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(goalBalance.toFixed(2))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary hover:text-secondary/80 bg-transparent border-0 cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isWithdrawing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > goalBalance}
                  className="bg-secondary text-white font-bold text-sm px-5 py-2 rounded-lg cursor-pointer disabled:opacity-50 border-0 transition-opacity hover:opacity-90 w-full sm:w-auto flex items-center justify-center min-w-[100px]"
                >
                  Confirm Reclaim
                </button>
              </div>

              <div className="space-y-1 min-h-[16px]">
                {amount && parseFloat(amount) > 0 && priceUsd > 0 && (
                  <p className="text-[11px] text-on-surface-variant">
                    USD Value: {formatXlmWithUsd(parseFloat(amount), priceUsd)}
                  </p>
                )}
                {amount && parseFloat(amount) > 0 && parseFloat(amount) <= goalBalance && (
                  <p className="text-[11px] text-green-600 font-medium">
                    Remaining in goal: {formatAmount(goalBalance - parseFloat(amount))} XLM
                  </p>
                )}
                {amount && parseFloat(amount) > goalBalance && (
                  <p className="text-[11px] text-red-600 font-medium">
                    Exceeds available balance of {formatAmount(goalBalance)} XLM
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
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-xs font-bold text-green-800">Goal Savings Reclaim Available</p>
                <p className="text-[11px] text-green-700/80 mt-0.5">
                  The goal lock has expired. As the sender, you can reclaim these matured savings back to your wallet.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(true)}
                disabled={isWithdrawing}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer border-0 shadow-sm flex items-center gap-1 shrink-0"
              >
                <ArrowUpRight size={14} />
                Reclaim Savings
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SenderBucketCard;
