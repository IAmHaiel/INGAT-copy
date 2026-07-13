import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon = Inbox, title, description, actionText, onAction }) => {
  return (
    <div className="bg-white border border-outline-variant p-8 rounded-xl flex flex-col items-center text-center space-y-3 max-w-sm mx-auto shadow-md">
      <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant font-medium">
        <Icon size={32} />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-on-surface text-base">{title}</h3>
        <p className="text-xs text-on-surface-variant max-w-xs">{description}</p>
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

export default EmptyState;

