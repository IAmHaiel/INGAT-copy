import React from 'react';
import { Wallet, Split, ShieldCheck, ArrowRightLeft } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: <Wallet className="w-8 h-8 text-primary" />,
      title: '1. Connect Wallet',
      description: 'The OFW Sender connects their Freighter wallet extension securely to the Stellar Testnet.',
    },
    {
      icon: <Split className="w-8 h-8 text-primary" />,
      title: '2. Set Split Allocation',
      description: 'Enter the receiver\'s address, split percentages (e.g. 60% spending, 40% goals), and goal unlock date.',
    },
    {
      icon: <ArrowRightLeft className="w-8 h-8 text-primary" />,
      title: '3. Execute Deposit',
      description: 'Confirm and sign the deposit transaction. Funds are instantly split into the designated buckets.',
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: '4. Secure Withdrawals',
      description: 'The receiver withdraws available funds at any time. Goal funds remain locked until the set date.',
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-20 px-6 bg-white border-y border-outline-variant">
      <div className="max-w-6xl mx-auto flex flex-col items-center space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface">
            How INGAT Works
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant max-w-xl font-medium mx-auto">
            A simple, secure on-chain flow ensuring money is spent wisely and saved reliably.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="bg-background-warm p-6 rounded-2xl border border-outline-variant hover:shadow-lg transition-all duration-300 flex flex-col space-y-4"
            >
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-outline-variant shadow-sm">
                {step.icon}
              </div>
              <h3 className="font-bold text-base text-on-surface">{step.title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
