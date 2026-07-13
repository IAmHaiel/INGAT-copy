'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ConnectWalletButton from '@/components/ui/wallet/ConnectWalletButton';
import WalletAddressBadge from '@/components/ui/wallet/WalletAddressBadge';
import { useWalletContext } from '@/context/WalletContext';
import { ShieldCheck, Send, Handshake, Coins, Zap } from 'lucide-react';

export default function LandingContainer() {
  const router = useRouter();
  const { publicKey, isConnected, isConnecting, error, connect, disconnect } = useWalletContext();

  const handleSelectRole = (role: 'sender' | 'receiver') => {
    router.push(`/${role}`);
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>

      {/* Header Branding */}
      <header className="w-full max-w-md flex flex-col items-center text-center mb-8">
        <div className="mb-2">
          <Image
            src="/logo.png"
            alt="INGAT Logo"
            width={180}
            height={180}
            className="object-contain mix-blend-multiply"
            priority
          />
        </div>
        <p className="font-medium text-sm text-on-surface-variant mt-1">
          Ingat sa biyahe, ingat din sa padala
        </p>
      </header>

      {/* Main Connection Card */}
      <div className="w-full max-w-md glass-card rounded-2xl p-6 shadow-xl flex flex-col items-center text-center space-y-6">
        {/* Motif Illustration */}
        <div className="relative w-40 h-40 flex items-center justify-center bg-primary/5 rounded-full border border-primary/10">
          <div className="hero-blob absolute inset-0 bg-primary/5 animate-[pulse_6s_infinite]"></div>
          <ShieldCheck size={64} className="text-primary relative z-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-on-surface">Secure Remittance Allocation</h2>
          <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
            A Stellar-based split protocol protecting remittances. Senders lock savings goals on-chain, receivers withdraw daily expenses freely.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-100 w-full text-center">
            {error}
          </div>
        )}

        <div className="w-full">
          {!isConnected ? (
            <ConnectWalletButton
              onConnect={connect}
              isConnecting={isConnecting}
              isConnected={isConnected}
              publicKey={publicKey}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-on-surface-variant font-medium">Connected Account</p>
                <WalletAddressBadge address={publicKey} onDisconnect={disconnect} />
              </div>

              <div className="pt-4 border-t border-outline-variant space-y-3 w-full">
                <p className="text-xs font-bold text-on-surface-variant">Select Your Role to Enter</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSelectRole('sender')}
                    className="flex flex-col items-center gap-2 bg-primary text-white p-4 rounded-xl font-bold transition-all active:scale-95 shadow-sm hover:shadow-md cursor-pointer text-xs border-0"
                  >
                    <Send size={24} />
                    <span>I am the Sender (OFW)</span>
                  </button>
                  <button
                    onClick={() => handleSelectRole('receiver')}
                    className="flex flex-col items-center gap-2 bg-secondary text-white p-4 rounded-xl font-bold transition-all active:scale-95 shadow-sm hover:shadow-md cursor-pointer text-xs border-0"
                  >
                    <Handshake size={24} />
                    <span>I am the Receiver</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-8">
        <div className="bg-white/50 border border-outline-variant p-4 rounded-xl flex gap-3 items-start">
          <div className="bg-primary/10 p-2 rounded-lg text-primary flex items-center justify-center">
            <Coins size={20} />
          </div>
          <div>
            <h3 className="font-bold text-xs text-on-surface">Zero Leakage</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Enforce locks on-chain to protect school fees or emergency goals.</p>
          </div>
        </div>
        <div className="bg-white/50 border border-outline-variant p-4 rounded-xl flex gap-3 items-start">
          <div className="bg-primary/10 p-2 rounded-lg text-primary flex items-center justify-center">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="font-bold text-xs text-on-surface">Instant split</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Remittances arrive split in seconds via Soroban smart contracts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
