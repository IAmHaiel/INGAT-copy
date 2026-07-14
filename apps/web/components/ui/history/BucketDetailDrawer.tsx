import React, { useState } from 'react';
import { X, Copy, ExternalLink, Calendar, Coins, Check, User, Save } from 'lucide-react';
import { EnrichedBucketEntry } from '@/hooks/useBucketHistory';
import { formatAmount, formatDate } from '@/lib/utils/format';
import { saveContact } from '@/lib/utils/contacts';
import BucketStatusBadge from './BucketStatusBadge';

interface BucketDetailDrawerProps {
  entry: EnrichedBucketEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onContactSaved?: () => void;
  mode?: 'sent' | 'received';
}

export const BucketDetailDrawer: React.FC<BucketDetailDrawerProps> = ({
  entry,
  isOpen,
  onClose,
  onContactSaved,
  mode = 'sent',
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedDepositTx, setCopiedDepositTx] = useState(false);
  const [copiedWithdrawTx, setCopiedWithdrawTx] = useState(false);
  
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactName, setContactName] = useState(entry?.receiverName || '');

  if (!entry || !isOpen) return null;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContact = () => {
    if (contactName.trim()) {
      saveContact(contactName.trim(), entry.receiverAddress);
      setIsEditingContact(false);
      if (onContactSaved) onContactSaved();
    }
  };

  const formatTxHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-8)}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto flex flex-col border-l border-outline-variant transition-transform transform translate-x-0 animate-[slideInRight_200ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant bg-surface-container-lowest">
          <div>
            <h3 className="text-base font-bold text-primary">Bucket Details</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Live on-chain & transaction log</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer text-on-surface-variant border-0 bg-transparent flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow p-6 space-y-6">
          {/* Status and Receiver */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/65 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-medium">Goal Status</span>
              <BucketStatusBadge status={entry.status} />
            </div>

            {/* Receiver / Address Book Section */}
            <div className="space-y-2 border-t border-outline-variant/50 pt-3">
              <span className="text-xs text-on-surface-variant font-medium block">
                {mode === 'received' ? 'Sender Details' : 'Recipient Details'}
              </span>
              
              {isEditingContact ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name (e.g. Mom)"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="flex-grow bg-white border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleSaveContact}
                    disabled={!contactName.trim()}
                    className="bg-primary text-white p-2 rounded-lg cursor-pointer border-0 hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
                    title="Save contact name"
                  >
                    <Save size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-on-surface-variant" />
                    <span className="text-xs font-semibold text-on-surface">
                      {entry.receiverName || 'No contact saved'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditingContact(true)}
                    className="text-[10px] text-secondary font-bold hover:underline cursor-pointer border-0 bg-transparent"
                  >
                    {entry.receiverName ? 'Rename' : 'Save Name'}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between bg-surface-container/60 px-3 py-2 rounded-lg font-mono text-[11px] select-all break-all text-on-surface-variant relative group">
                <span className="pr-8">{entry.receiverAddress}</span>
                <button
                  onClick={() => copyToClipboard(entry.receiverAddress, setCopiedAddress)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white hover:bg-surface-container border border-outline-variant rounded text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  title={mode === 'received' ? "Copy sender wallet address" : "Copy receiver wallet address"}
                >
                  {copiedAddress ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Allocation Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Initial Remittance</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
                <p className="text-[10px] text-on-surface-variant font-medium">Spending Split ({entry.splitRatio}%)</p>
                <p className="text-base font-black text-primary mt-0.5">{formatAmount(entry.spendingAmount)} XLM</p>
              </div>
              <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
                <p className="text-[10px] text-on-surface-variant font-medium">Goal Split ({100 - entry.splitRatio}%)</p>
                <p className="text-base font-black text-secondary mt-0.5">{formatAmount(entry.goalAmount)} XLM</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Total Deposited</span>
                <span className="font-bold text-on-surface">{formatAmount(entry.depositAmount)} XLM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Deposit Date</span>
                <span className="font-semibold text-on-surface">{formatDate(entry.depositDate)}</span>
              </div>
              {entry.goalAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Timelock Release</span>
                  <span className="font-semibold text-on-surface flex items-center gap-1">
                    <Calendar size={12} className="text-secondary" />
                    {formatDate(entry.unlockDate)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-outline-variant/50 pt-2.5">
                <span className="text-on-surface-variant">Deposit Transaction</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(entry.depositTxHash, setCopiedDepositTx)}
                    className="p-1 hover:bg-surface-container rounded border border-outline-variant/40 bg-white text-on-surface-variant cursor-pointer"
                    title="Copy deposit transaction hash"
                  >
                    {copiedDepositTx ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                  </button>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${entry.depositTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-0.5 font-semibold font-mono"
                  >
                    {formatTxHash(entry.depositTxHash)}
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Live Balances (On-Chain) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Live On-Chain Balances</h4>
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <Coins size={12} className="text-primary" />
                  Live Spending Balance
                </span>
                <span className="font-bold text-primary">
                  {entry.liveSpendingBalance !== null ? `${formatAmount(entry.liveSpendingBalance)} XLM` : '0.00 XLM'}
                </span>
              </div>
              {entry.goalAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <Coins size={12} className="text-secondary" />
                    Live Goal Balance
                  </span>
                  <span className={`font-bold ${entry.status === 'locked' ? 'text-secondary' : 'text-green-600'}`}>
                    {entry.liveGoalBalance !== null ? `${formatAmount(entry.liveGoalBalance)} XLM` : '0.00 XLM'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Withdrawal Receipt */}
          {entry.status === 'withdrawn' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Withdrawal Receipt</h4>
              <div className="bg-green-50/50 border border-green-200 rounded-xl p-4 text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-green-800">Goal Withdrawn</span>
                  <span className="font-bold text-green-700">{formatAmount(entry.goalAmount)} XLM</span>
                </div>
                {entry.goalWithdrawalDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-800/80">Withdrawal Date</span>
                    <span className="font-semibold text-green-700">{formatDate(entry.goalWithdrawalDate)}</span>
                  </div>
                )}
                {entry.goalWithdrawalTxHash && (
                  <div className="flex justify-between items-center border-t border-green-200/50 pt-2.5">
                    <span className="text-green-800/80">Withdrawal Transaction</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(entry.goalWithdrawalTxHash!, setCopiedWithdrawTx)}
                        className="p-1 hover:bg-green-100 rounded border border-green-200/40 bg-white text-green-700 cursor-pointer"
                        title="Copy withdrawal transaction hash"
                      >
                        {copiedWithdrawTx ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                      </button>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${entry.goalWithdrawalTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-700 hover:underline flex items-center gap-0.5 font-semibold font-mono"
                      >
                        {formatTxHash(entry.goalWithdrawalTxHash)}
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reserved slot for Phase 2 Emergency Requests */}
          <div className="border-t border-outline-variant pt-4 text-center">
            <span className="text-[10px] text-on-surface-variant italic">
              Emergency Override Controls (Phase 2) are not active on this bucket.
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default BucketDetailDrawer;
