'use client';

import React from 'react';
import { useToast, ToastPayload } from '@/context/ToastContext';
import { CheckCircle, AlertCircle, Info, X, ExternalLink } from 'lucide-react';

const ToastItem: React.FC<{ toast: ToastPayload; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="text-teal shrink-0" size={18} />;
      case 'error':
        return <AlertCircle className="text-terracotta shrink-0" size={18} />;
      case 'info':
      default:
        return <Info className="text-amber shrink-0" size={18} />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'border-teal bg-white/95 text-on-surface shadow-lg shadow-teal/5';
      case 'error':
        return 'border-terracotta bg-white/95 text-on-surface shadow-lg shadow-terracotta/5';
      case 'info':
      default:
        return 'border-outline-variant bg-white/95 text-on-surface shadow-lg';
    }
  };

  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border max-w-sm w-full transition-all duration-300 ease-out backdrop-blur-md ${getColorClasses()}`}
      role="alert"
    >
      {getIcon()}
      <div className="flex-grow space-y-1">
        <h4 className="text-xs font-bold text-on-surface">{toast.title}</h4>
        {toast.message && (
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            {toast.message}
          </p>
        )}
        {toast.txHash && (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${toast.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 font-bold mt-1"
          >
            View transaction <ExternalLink size={10} />
          </a>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded p-0.5 transition-colors h-fit cursor-pointer border-0 bg-transparent flex items-center justify-center"
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
