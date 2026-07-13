import React from 'react';
import { ShieldAlert, Zap, Layers, BadgePercent } from 'lucide-react';

export default function Features() {
  const items = [
    {
      icon: <BadgePercent className="w-6 h-6 text-primary" />,
      title: 'Zero Hidden Fees',
      desc: 'Direct peer-to-peer remittance with transparent Stellar network transaction fees only.',
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: 'Instant Transfers',
      desc: 'Send money home to the Philippines in seconds, fully automated on Stellar Testnet.',
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-primary" />,
      title: 'Guaranteed Savings',
      desc: 'Lock educational or emergency funds securely using Soroban smart contracts. No early unlocks.',
    },
    {
      icon: <Layers className="w-6 h-6 text-primary" />,
      title: 'Sleek Dual Role Views',
      desc: 'One dashboard to seamlessly toggle between sending money and checking available vaults.',
    },
  ];

  return (
    <section id="features" className="w-full py-20 px-6 bg-background-warm/60">
      <div className="max-w-6xl mx-auto flex flex-col items-center space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface">
            Core Security Features
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant max-w-xl font-medium mx-auto">
            Engineered on Stellar for total transparency, top-tier performance, and absolute security.
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
