import React from 'react';
import { Split, Lock, AlertTriangle, Wallet, LayoutDashboard, Users } from 'lucide-react';

export default function Features() {
  const items = [
    {
      icon: <Split className="w-6 h-6 text-primary" />,
      title: 'Programmable Split Remittance',
      desc: 'Instantly divide deposits into a Spending bucket and a Goal bucket using custom ratios. No manual budgeting or mental math required.',
    },
    {
      icon: <Lock className="w-6 h-6 text-primary" />,
      title: 'On-Chain Goal Lock',
      desc: 'Lock goal savings on-chain using smart contracts until a set date. Capital is fully protected and secured by Soroban ledger leases.',
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-primary" />,
      title: 'Emergency Early Access',
      desc: 'Receivers can request emergency early access to locked funds. Senders retain full oversight to approve or reject requests with strict cool-down rules.',
    },
    {
      icon: <Wallet className="w-6 h-6 text-primary" />,
      title: 'Freighter Wallet Security',
      desc: 'Connect securely using Freighter Wallet. Sign and verify transactions client-side without exposing private keys or seed phrases.',
    },
    {
      icon: <LayoutDashboard className="w-6 h-6 text-primary" />,
      title: 'Unified Dashboard & History',
      desc: 'Seamlessly toggle between Sender and Receiver roles. View real-time balances, track lock timers, and review permanent transaction logs.',
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: 'Address Book Aliases',
      desc: 'Assign names to wallet addresses to easily recognize senders and receivers across all transaction logs, active buckets, and early request views.',
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
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
