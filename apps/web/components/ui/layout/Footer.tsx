import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative w-full py-12 px-6 border-t border-outline-variant bg-surface-container overflow-hidden">
      {/* Stellar grid/square background pattern */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-outline-variant) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-outline-variant) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Glow dot intersections to resemble a node network */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-primary-container) 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="font-bold text-sm text-primary">INGAT Remit</p>
          <p className="font-medium text-xs text-on-surface-variant">
            © 2026 INGAT Remit. Secure Stellar Blockchain Remittance.
          </p>
        </div>
        <nav className="flex gap-8">
          <Link
            href="/#home"
            className="text-xs font-bold text-primary hover:underline transition-all"
          >
            What is INGAT?
          </Link>
          <Link
            href="/#how-it-works"
            className="text-xs font-medium text-on-surface-variant hover:text-primary hover:underline transition-all"
          >
            Help Center
          </Link>
          <Link
            href="/#features"
            className="text-xs font-medium text-on-surface-variant hover:text-primary hover:underline transition-all"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
