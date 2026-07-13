import React from 'react';
import { Play } from 'lucide-react';

export default function Video() {
  return (
    <section className="w-full py-16 px-6 bg-surface-container-low/40">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface">
          See how INGAT protects your family&apos;s future
        </h2>
        <p className="text-sm md:text-base text-on-surface-variant max-w-xl font-medium">
          A quick walkthrough of how easily you can connect your wallet, specify split ratios, and lock financial goals.
        </p>

        {/* Video Mockup Screen */}
        <div className="relative w-full aspect-video bg-inverse-surface rounded-2xl overflow-hidden border border-outline-variant shadow-2xl flex items-center justify-center group cursor-pointer">
          {/* Subtle overlay grid */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, #ffffff 1px, transparent 1px),
                linear-gradient(to bottom, #ffffff 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
          <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />

          {/* Interactive Play Button */}
          <div className="relative z-10 w-20 h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300">
            <Play size={32} className="text-primary fill-primary ml-1" />
          </div>

          <div className="absolute bottom-6 left-6 text-left z-10 text-white/90">
            <h4 className="font-bold text-sm">INGAT Remittance Split Protocol</h4>
            <p className="text-xs text-white/60">Demo Video (2:30)</p>
          </div>
        </div>
      </div>
    </section>
  );
}
