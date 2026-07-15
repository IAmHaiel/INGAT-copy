import React, { useState, useEffect } from 'react';
import { Wallet, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onConnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
}

export default function Hero({ onConnect, isConnected, isConnecting }: HeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <section id="home" className="w-full py-20 md:py-32 px-6 relative overflow-hidden flex flex-col items-center bg-surface-container/20">
      {/* Glow Ambient Circles */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 blur-[100px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 blur-[100px] rounded-full -z-10 animate-pulse" />

      <div className="max-w-4xl mx-auto w-full flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary w-fit animate-fade-in">
          <ShieldCheck size={16} />
          <span className="text-xs font-bold tracking-wide">Secure Stellar Smart Contract Remittance</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-on-surface leading-[1.1] animate-slide-up max-w-3xl">
          Ingat sa biyahe,<br />
          <span className="text-primary">ingat din sa padala.</span>
        </h1>

        <p className="text-base md:text-lg text-on-surface-variant max-w-2xl font-medium leading-relaxed animate-slide-up mx-auto">
          Ensure your hard-earned remittances are allocated exactly where they need to go. 
          Split deposits instantly into available spending funds and locked goal savings on-chain.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 min-h-[52px] justify-center items-center">
          {!mounted ? (
            <div className="w-[220px] h-[52px] bg-primary/5 rounded-xl animate-pulse" />
          ) : !isConnected ? (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="bg-primary hover:bg-primary-container text-white py-4 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 border-0 cursor-pointer animate-fade-in w-full sm:w-auto"
            >
              <Wallet size={20} />
              {isConnecting ? 'Connecting to Wallet...' : 'Connect Freighter Wallet'}
            </button>
          ) : (
            <a
              href="/dashboard"
              className="bg-primary hover:bg-primary-container text-white py-4 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-lg border-0 cursor-pointer animate-fade-in w-full sm:w-auto"
            >
              Go to Dashboard
            </a>
          )}
          {mounted && (
            <a
              href="#how-it-works"
              className="bg-white hover:bg-surface-container text-on-surface py-4 px-8 rounded-xl font-bold text-sm flex items-center justify-center border border-outline-variant transition-all active:scale-95 shadow-sm animate-fade-in w-full sm:w-auto"
            >
              See How It Works
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
