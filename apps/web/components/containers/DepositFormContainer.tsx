'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DepositForm from '@/components/ui/deposit/DepositForm';
import WalletAddressBadge from '@/components/ui/wallet/WalletAddressBadge';
import { useWalletContext } from '@/context/WalletContext';
import { useDeposit } from '@/hooks/useDeposit';
import { DepositFormInputs } from '@/types/transaction';
import { toast } from 'sonner';
 
export default function DepositFormContainer() {
  const router = useRouter();
  const { publicKey, isConnected, isInitializing, disconnect } = useWalletContext();
 
  const { deposit, isSubmitting, errors, txError } = useDeposit(publicKey, (hash) => {
    toast.success('Deposit Split Completed!', {
      description: `Confirmed on testnet: ${hash.slice(0, 8)}...${hash.slice(-8)}`,
      action: {
        label: 'View Tx',
        onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${hash}`, '_blank')
      },
      duration: 10000
    });
    router.push('/dashboard');
  });

  useEffect(() => {
    if (isInitializing) return;
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, isInitializing, router]);

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  const handleDepositSubmit = async (inputs: DepositFormInputs): Promise<boolean> => {
    return await deposit(inputs);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 flex-grow w-full">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/sender')}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer border-0 text-on-surface-variant flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-primary">New Remittance</h1>
          </div>
        </div>
        <WalletAddressBadge address={publicKey} onDisconnect={disconnect} />
      </header>

      {/* Form */}
      <DepositForm
        onDeposit={handleDepositSubmit}
        isSubmitting={isSubmitting}
        validationErrors={errors}
        txError={txError}
      />
    </div>
  );
}
