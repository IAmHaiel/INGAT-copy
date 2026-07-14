'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TransactionStatus from '@/components/ui/feedback/TransactionStatus';

interface TransactionConfirmationContainerProps {
  type: 'deposit' | 'withdraw';
}

function TransactionConfirmationContent({ type }: TransactionConfirmationContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hash = searchParams.get('hash');
  const errorParam = searchParams.get('error');

  const status: 'success' | 'error' = errorParam ? 'error' : 'success';
  const dashboardPath = '/dashboard';

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6 flex-grow flex flex-col justify-center w-full animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-lg text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-on-surface">Transaction Confirmation</h1>
          <p className="text-xs text-on-surface-variant">
            {type === 'deposit'
              ? 'Your remittance allocation has been submitted to the Stellar Network.'
              : 'Your withdrawal has been submitted to the Stellar Network.'}
          </p>
        </div>

        <TransactionStatus
          status={status}
          hash={hash}
          errorMsg={errorParam}
        />



        <div className="pt-4 border-t border-outline-variant space-y-2 w-full">
          <button
            onClick={() => router.push(dashboardPath)}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold transition-all active:scale-95 cursor-pointer shadow-sm text-sm border-0"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionConfirmationContainer({ type }: TransactionConfirmationContainerProps) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      }
    >
      <TransactionConfirmationContent type={type} />
    </Suspense>
  );
}
