import React from 'react';
import { SplitSquareVertical, Lock, Wallet, LayoutDashboard } from 'lucide-react';

export default function Features() {
  const items = [
    {
      icon: <SplitSquareVertical className="w-6 h-6 text-primary" />,
      title: 'Programmable Split Remittance',
      desc: 'Automatically divide every deposit into a Spending bucket and a Goal bucket using your chosen ratio — no manual budgeting needed.',
    },
    {
      icon: <Lock className="w-6 h-6 text-primary" />,
      title: 'On-Chain Goal Lock',
      desc: 'Protect savings by locking the Goal bucket on-chain until a future date you set. Funds cannot be withdrawn early — enforced by the smart contract.',
    },
    {
      icon: <Wallet className="w-6 h-6 text-primary" />,
      title: 'Freighter Wallet Integration',
      desc: 'Connect with one click via Freighter. Sign transactions securely without ever exposing your private keys.',
    },
    {
      icon: <LayoutDashboard className="w-6 h-6 text-primary" />,
      title: 'Unified Sender & Receiver Dashboard',
      desc: 'Toggle between Sender and Receiver modes in a single dashboard. Send splits, view vaults, withdraw funds, and track full transaction history.',
    },
  ];

  return (
    <section id="features" className="w-full py-20 px-6 bg-background-warm/60">
      <div className="max-w-6xl mx-auto flex flex-col items-center space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface">
            Core Features
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant max-w-xl font-medium mx-auto">
            Everything you need to send, split, and protect remittances — powered by Stellar and Soroban.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white/80 backdrop-blur-sm border border-outline-variant p-6 rounded-2xl flex gap-4 items-start hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            >
              <div className="bg-primary/10 p-3 rounded-xl text-primary flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-on-surface">{item.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
