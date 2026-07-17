'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletContext } from '@/context/WalletContext';
import Header from '@/components/ui/layout/Header';
import WalletConnectModal from '@/components/ui/wallet/WalletConnectModal';

export default function PrivacyPolicyContainer() {
  const router = useRouter();
  const { publicKey, isConnected, isConnecting, connectionStatus, error, connect, disconnect } = useWalletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnect = () => {
    setIsModalOpen(true);
    connect();
  };

  const handleRetry = () => {
    connect();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (isConnected && isModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsModalOpen(false);
      router.push('/dashboard');
    }
  }, [isConnected, isModalOpen, router]);

  return (
    <div className="min-h-screen flex flex-col bg-background-warm text-on-surface">
      <Header
        publicKey={publicKey}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onConnect={handleConnect}
        onDisconnect={disconnect}
      />
      
      <main className="flex-grow max-w-4xl mx-auto py-16 px-6 sm:px-8 space-y-8 animate-[fadeIn_150ms_ease-out]">
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-primary tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-on-surface-variant">Last updated: July 15, 2026</p>
        </div>

        <div className="prose prose-sm text-on-surface-variant space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface border-b border-outline-variant pb-2">1. Overview</h2>
            <p>
              Welcome to <strong>INGAT Remit</strong>. INGAT is a smart contract vault built for Overseas Filipino Workers (OFWs) to split remittance deposits into spending and goal-oriented lockups. 
            </p>
            <p className="italic text-xs bg-surface-container px-3 py-2.5 rounded-lg border border-outline-variant/60">
              <strong>Hackathon Note:</strong> This application is currently deployed as a prototype / demonstration project for the Stellar APAC Hackathon. All transactions execute on the Stellar Testnet.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface border-b border-outline-variant pb-2">2. Data We Collect & Store</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Public Blockchain Data:</strong> Since all deposit, split, and withdrawal operations are processed on-chain using Soroban smart contracts on the Stellar network, transaction hashes, public addresses, lock balances, and release timers are permanent, public records.
              </li>
              <li>
                <strong>Off-Chain Metadata Cache:</strong> To improve dashboard load times and provide cross-device history (past the standard 24-hour RPC event window), we cache transaction records, split ratios, and goal labels in our secure Supabase database.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface border-b border-outline-variant pb-2">3. Wallet Connections & Security</h2>
            <p>
              INGAT Remit does not request, hold, or transmit your private keys or seed phrases. All transaction signatures are securely generated and verified client-side using the <strong>Freighter Wallet</strong> browser extension. 
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface border-b border-outline-variant pb-2">4. Third-Party Services</h2>
            <p>
              We integrate with the following services to deliver our remittance features:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Stellar Network / RPC Nodes:</strong> For querying and broadcasting transactions.</li>
              <li><strong>Supabase:</strong> For caching transaction history and managing RLS-secured metadata.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-on-surface border-b border-outline-variant pb-2">5. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our prototype features or integration requirements. We encourage users to check this page periodically for updates.
            </p>
          </section>
        </div>
      </main>

      {/* Wallet Connection Modal */}
      <WalletConnectModal
        isOpen={isModalOpen}
        status={connectionStatus}
        errorMessage={error}
        onRetry={handleRetry}
        onClose={handleCloseModal}
      />
    </div>
  );
}
