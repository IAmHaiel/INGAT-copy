import React from 'react';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

export default function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
  mobileOnly = false,
  desktopOnly = false,
}: PaginationControlsProps) {
  let className = 'flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm text-xs font-semibold';
  
  if (mobileOnly) {
    className += ' md:hidden mb-2';
  } else if (desktopOnly) {
    className += ' hidden md:flex';
  }

  return (
    <div className={className}>
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Previous
      </button>
      <span className="text-on-surface-variant">
        Page {page} of {totalPages || 1}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages || totalPages <= 1}
        className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Next
      </button>
    </div>
  );
}
