import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
    <section id="home" className="w-full py-16 md:py-24 px-6 relative overflow-hidden flex flex-col items-center">
      {/* Glow Ambient Circles */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/5 blur-[100px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 blur-[100px] rounded-full -z-10 animate-pulse" />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headline & Action */}
        <div className="lg:col-span-7 flex flex-col space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary w-fit animate-fade-in">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold tracking-wide">Secure Stellar Smart Contract Remittance</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-on-surface leading-[1.1] animate-slide-up">
            Ingat sa biyahe,<br />
            <span className="text-primary">ingat din sa padala.</span>
          </h1>

          <p className="text-base md:text-lg text-on-surface-variant max-w-xl font-medium leading-relaxed animate-slide-up">
            Ensure your hard-earned remittances are allocated exactly where they need to go. 
            Split deposits instantly into available spending funds and locked goal savings on-chain.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 min-h-[52px]">
            {!mounted ? (
              <div className="w-[220px] h-[52px] bg-primary/5 rounded-xl animate-pulse" />
            ) : !isConnected ? (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="bg-primary hover:bg-primary-container text-white py-4 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 border-0 cursor-pointer animate-fade-in"
              >
                <Wallet size={20} />
                {isConnecting ? 'Connecting to Wallet...' : 'Connect Freighter Wallet'}
              </button>
            ) : (
              <a
                href="/dashboard"
                className="bg-primary hover:bg-primary-container text-white py-4 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md hover:shadow-lg border-0 cursor-pointer animate-fade-in"
              >
                Go to Dashboard
              </a>
            )}
            {mounted && (
              <a
                href="#how-it-works"
                className="bg-white hover:bg-surface-container text-on-surface py-4 px-8 rounded-xl font-bold text-sm flex items-center justify-center border border-outline-variant transition-all active:scale-95 shadow-sm animate-fade-in"
              >
                See How It Works
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Illustration Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-[420px] aspect-square bg-white/40 backdrop-blur-md rounded-3xl p-8 border border-white/30 shadow-xl flex items-center justify-center hover:shadow-2xl transition-all duration-500">
            <div className="hero-blob absolute inset-4 bg-primary-container/5 -z-10 animate-[pulse_8s_infinite]" />
            <div className="relative w-4/5 h-4/5">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN13MJdiO6ByMQBXeGKFk-cS4ZDG_nhM6O-q_Mti5iqw1WELRyRxfHtS1oftqiGMU4fyYM92Mc-zP-re_oN7g3Na-42jK5PRgAoTtfUcYDrokxMleqP-rKXz4X41pUj6w79i7umWF-3iB2MNNKD41x5-fkk839E4VNTO9ED54fWIsUPhjYRtBSw3oOm1rlU5uPjGLD8aYxHiSBBz47D9DeLFdXz0us5sMk3_GNFrNFc9xLS7dai-zg6g"
                alt="INGAT Illustration representing family and security"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
