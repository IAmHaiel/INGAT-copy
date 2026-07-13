'use client';
 
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, Menu, X } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 
  useEffect(() => {
    setMounted(true);
  }, []);
 
  return (
    <header className="w-full sticky top-0 z-40 bg-background-warm/80 backdrop-blur-md border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-6 overflow-y-hidden h-16 flex items-center justify-between">
        {/* Left Side: Logo */}
        <div className="flex items-center overflow-y-hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="INGAT Logo"
              width={100}
              height={30}
              className="object-contain mix-blend-multiply"
              priority
            />
          </Link>
        </div>
 
        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="/#home"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            Home
          </a>
          <a
            href="/#how-it-works"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            How it works
          </a>
          <a
            href="/#features"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            Features
          </a>
        </nav>
 
        {/* Right Side: Wallet Connection (Desktop) */}
        <div className="hidden md:flex items-center gap-3 min-w-[120px] justify-end">
          {!mounted ? (
            <div className="h-8 w-28 bg-primary/5 rounded-lg animate-pulse" />
          ) : isConnected && publicKey ? (
            <div className="flex items-center gap-4 animate-fade-in">
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
              className="bg-primary-container text-white py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95 hover:brightness-110 hover:shadow-md disabled:opacity-50 border-0 cursor-pointer animate-fade-in"
            >
              <Wallet size={16} />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
 
        {/* Hamburger Menu Toggle (Mobile Only) */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-on-surface-variant hover:text-primary p-2 focus:outline-none transition-transform duration-300"
            style={{ transform: isMobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
 
      {/* Mobile Menu Dropdown (Animated Drawer) */}
      <div 
        className={`md:hidden absolute top-16 left-0 w-full bg-background-warm/95 backdrop-blur-md border-b border-outline-variant shadow-lg py-4 px-6 flex flex-col gap-4 z-50 transition-all duration-300 ease-in-out origin-top ${
          isMobileMenuOpen 
            ? 'opacity-100 scale-y-100 pointer-events-auto' 
            : 'opacity-0 scale-y-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col gap-2">
          <a
            href="/#home"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-base font-semibold text-on-surface-variant hover:text-primary transition-colors py-2 border-b border-outline-variant/30"
          >
            Home
          </a>
          <a
            href="/#how-it-works"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-base font-semibold text-on-surface-variant hover:text-primary transition-colors py-2 border-b border-outline-variant/30"
          >
            How it works
          </a>
          <a
            href="/#features"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-base font-semibold text-on-surface-variant hover:text-primary transition-colors py-2 border-b border-outline-variant/30"
          >
            Features
          </a>
        </nav>
 
        <div className="pt-2 flex flex-col gap-4">
          {!mounted ? (
            <div className="h-10 w-full bg-primary/5 rounded-lg animate-pulse" />
          ) : isConnected && publicKey ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/dashboard');
                }}
                className="w-full bg-primary text-white text-sm font-bold py-3 px-4 rounded-lg transition-all active:scale-95 hover:brightness-110 shadow-sm border-0 cursor-pointer text-center"
              >
                Go to Dashboard
              </button>
              <div className="flex justify-center py-1">
                <WalletAddressBadge 
                  address={publicKey} 
                  onDisconnect={() => {
                    setIsMobileMenuOpen(false);
                    onDisconnect();
                  }} 
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onConnect();
              }}
              disabled={isConnecting}
              className="w-full bg-primary-container text-white py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 hover:brightness-110 hover:shadow-md disabled:opacity-50 border-0 cursor-pointer"
            >
              <Wallet size={18} />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
