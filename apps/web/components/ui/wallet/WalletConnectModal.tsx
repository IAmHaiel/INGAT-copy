import React from 'react';
import { Wallet, AlertTriangle, Lock, XCircle, ExternalLink, X, RefreshCw } from 'lucide-react';
import { WalletConnectionStatus } from '@/types/wallet';

interface WalletConnectModalProps {
  isOpen: boolean;
  status: WalletConnectionStatus;
  errorMessage: string | null;
  onRetry: () => void;
  onClose: () => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  status,
  errorMessage,
  onRetry,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && status !== 'connecting') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Connect Wallet"
    >
      <div className="relative glass-card rounded-2xl p-8 shadow-2xl w-full max-w-sm mx-4 flex flex-col items-center text-center space-y-5 animate-[scaleIn_150ms_ease-out]">
        {/* Freighter Branding */}
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
          <Wallet size={32} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-on-surface">Freighter Wallet</h2>

        {/* Connecting State */}
        {status === 'connecting' && (
          <div className="flex flex-col items-center space-y-4">
            <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant font-medium">
              Connecting to Freighter...
            </p>
            <p className="text-xs text-on-surface-variant/70">
              Please approve the connection in your Freighter extension
            </p>
          </div>
        )}

        {/* Not Installed State */}
        {status === 'not-installed' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-amber" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-on-surface">
                Freighter Not Detected
              </p>
              <p className="text-xs text-on-surface-variant max-w-xs">
                Install the Freighter browser extension to connect your Stellar wallet.
              </p>
            </div>
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white py-2.5 px-5 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-95"
            >
              Install Freighter <ExternalLink size={14} />
            </a>
            <button
              onClick={onClose}
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent font-medium"
            >
              Close
            </button>
          </div>
        )}

        {/* Locked State */}
        {status === 'locked' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
              <Lock size={24} className="text-secondary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-on-surface">
                Wallet Locked
              </p>
              <p className="text-xs text-on-surface-variant max-w-xs">
                Please unlock your Freighter wallet extension and try again.
              </p>
            </div>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-primary text-white py-2.5 px-5 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-95 cursor-pointer border-0"
            >
              <RefreshCw size={14} /> Try Again
            </button>
            <button
              onClick={onClose}
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent font-medium"
            >
              Close
            </button>
          </div>
        )}

        {/* Generic Error State */}
        {status === 'error' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-on-surface">
                Connection Failed
              </p>
              <p className="text-xs text-on-surface-variant max-w-xs">
                {errorMessage || 'Unable to connect to Freighter. Please try again.'}
              </p>
            </div>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-primary text-white py-2.5 px-5 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-95 cursor-pointer border-0"
            >
              <RefreshCw size={14} /> Try Again
            </button>
            <button
              onClick={onClose}
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent font-medium"
            >
              Close
            </button>
          </div>
        )}

        {/* Close button (top-right) — only when not connecting */}
        {status !== 'connecting' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent p-1 rounded-full hover:bg-black/5"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default WalletConnectModal;
