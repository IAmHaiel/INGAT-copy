import React from 'react';
import { ShieldCheck, Wallet } from 'lucide-react';

interface ConnectWalletButtonProps {
  onConnect: () => void;
  isConnecting: boolean;
  isConnected: boolean;
  publicKey: string | null;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  onConnect,
  isConnecting,
  isConnected,
  publicKey,
}) => {
  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-semibold border border-primary/20">
        <ShieldCheck size={20} />
        <span>Connected</span>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      disabled={isConnecting}
      className="w-full bg-primary-container text-white py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer border-0"
    >
      <Wallet size={22} />
      {isConnecting ? 'Connecting Wallet...' : 'Connect Wallet'}
    </button>
  );
};

export default ConnectWalletButton;
