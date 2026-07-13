import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Something went wrong', message, actionText, onAction }) => {
  return (
    <div className="bg-red-50/50 border border-red-200 p-6 rounded-xl flex flex-col items-center text-center space-y-3 max-w-md mx-auto shadow-sm">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
        <AlertTriangle size={28} />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-on-surface text-base">{title}</h3>
        <p className="text-xs text-on-surface-variant max-w-xs">{message}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm border-0"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
