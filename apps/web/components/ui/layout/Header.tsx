'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import WalletAddressBadge from '@/components/ui/wallet/WalletAddressBadge';

interface HeaderProps {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Header({
  publicKey,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="w-full sticky top-0 z-40 bg-background-warm/80 backdrop-blur-md border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Side: Logo */}
        <div className="flex items-center max-h-12 overflow-hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="INGAT Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain mix-blend-multiply"
              priority
            />
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#home"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            Home
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            Features
          </a>
        </nav>

        {/* Right Side: Wallet Connection */}
        <div className="flex items-center gap-3">
          {isConnected && publicKey ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-primary text-white text-xs font-bold py-2 px-4 rounded-lg transition-all active:scale-95 hover:brightness-110 shadow-sm border-0 cursor-pointer"
              >
                Go to Dashboard
              </button>
              <WalletAddressBadge address={publicKey} onDisconnect={onDisconnect} />
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="bg-primary-container text-white py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95 hover:brightness-110 hover:shadow-md disabled:opacity-50 border-0 cursor-pointer"
            >
              <Wallet size={16} />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
