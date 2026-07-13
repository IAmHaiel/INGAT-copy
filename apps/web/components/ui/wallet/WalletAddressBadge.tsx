import React from 'react';
import { formatAddress } from '@/lib/utils/format';

interface WalletAddressBadgeProps {
  address: string | null;
  onDisconnect: () => void;
}

const WalletAddressBadge: React.FC<WalletAddressBadgeProps> = ({ address, onDisconnect }) => {
  if (!address) return null;

  return (
    <div className="flex items-center gap-2 bg-surface-container border border-outline-variant px-3 py-1.5 rounded-full shadow-sm text-sm">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span className="font-mono text-on-surface-variant font-medium">{formatAddress(address)}</span>
      <button
        onClick={onDisconnect}
        className="ml-1 text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer border-0 bg-transparent p-0 flex items-center"
        title="Disconnect Wallet"
      >
        <span className="material-symbols-outlined text-[16px]">logout</span>
      </button>
    </div>
  );
};

export default WalletAddressBadge;
