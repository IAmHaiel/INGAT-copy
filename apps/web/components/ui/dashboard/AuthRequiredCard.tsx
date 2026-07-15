import React from 'react';

interface AuthRequiredCardProps {
  onSign: () => void;
  isAuthenticating: boolean;
  authError: string | null;
}

export default function AuthRequiredCard({
  onSign,
  isAuthenticating,
  authError,
}: AuthRequiredCardProps) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-outline-variant shadow-lg max-w-md mx-auto text-center space-y-6">
      <div className="bg-amber-50 text-amber-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-amber-100">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-secondary">Signature Required</h2>
        <p className="text-sm text-on-primary-container leading-relaxed">
          We need your secure signature to authenticate and load your protected vault buckets.
        </p>
        {authError && authError !== 'The user rejected this request.' && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 mt-2 font-mono break-words">
            {authError}
          </p>
        )}
      </div>
      <button
        onClick={onSign}
        disabled={isAuthenticating}
        className="w-full bg-secondary text-white py-3 rounded-lg font-bold transition-all active:scale-95 cursor-pointer shadow-md hover:shadow-lg border-0 disabled:opacity-50"
      >
        {isAuthenticating ? 'Waiting for signature...' : 'Sign Authentication Message'}
      </button>
    </div>
  );
}
