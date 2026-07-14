'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletContext } from '@/context/WalletContext';
import Header from '@/components/ui/layout/Header';
import Footer from '@/components/ui/layout/Footer';
import Hero from '@/components/ui/landing/Hero';
import Video from '@/components/ui/landing/Video';
import HowItWorks from '@/components/ui/landing/HowItWorks';
import Features from '@/components/ui/landing/Features';
import WalletConnectModal from '@/components/ui/wallet/WalletConnectModal';

export default function LandingContainer() {
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

  // Redirect to dashboard only when actively connecting through the modal
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
      
      <main className="flex-grow">
        <Hero 
          onConnect={handleConnect} 
          isConnected={isConnected} 
          isConnecting={isConnecting} 
        />
        <Video />
        <HowItWorks />
        <Features />
      </main>

      <Footer />

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
