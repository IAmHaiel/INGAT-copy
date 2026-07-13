import React from 'react';

interface TransactionStatusProps {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash: string | null;
  errorMsg?: string | null;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({ status, hash, errorMsg }) => {
  if (status === 'idle') return null;

  return (
    <div className="p-4 rounded-xl border flex flex-col items-center text-center space-y-2 shadow-sm bg-white border-outline-variant">
      {status === 'pending' && (
        <>
          <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm font-semibold text-on-surface">Submitting transaction to Stellar...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-1">
            <span className="material-symbols-outlined text-[28px]">check_circle</span>
          </div>
          <p className="text-sm font-bold text-green-700">Transaction Confirmed!</p>
          {hash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer"
            >
              View on Stellar.expert <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </a>
          )}
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-1">
            <span className="material-symbols-outlined text-[28px]">error</span>
          </div>
          <p className="text-sm font-bold text-red-700">Transaction Failed</p>
          <p className="text-xs text-on-surface-variant max-w-xs">{errorMsg || 'An unknown error occurred.'}</p>
        </>
      )}
    </div>
  );
};

export default TransactionStatus;
