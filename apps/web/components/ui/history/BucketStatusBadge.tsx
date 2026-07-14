import React from 'react';
import { Lock, Unlock, CheckCircle, ArrowRightLeft, AlertTriangle, Zap } from 'lucide-react';
import { BucketGoalStatus } from '@/hooks/useBucketHistory';

interface BucketStatusBadgeProps {
  status: BucketGoalStatus;
}

export const BucketStatusBadge: React.FC<BucketStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'locked':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Lock size={12} className="text-amber-500 animate-pulse" />
          <span>Locked</span>
        </span>
      );
    case 'unlocked':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
          <Unlock size={12} className="text-green-500" />
          <span>Unlocked</span>
        </span>
      );
    case 'withdrawn':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
          <CheckCircle size={12} className="text-gray-400" />
          <span>Withdrawn</span>
        </span>
      );
    case 'spending_only':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <ArrowRightLeft size={12} className="text-blue-500" />
          <span>Spending</span>
        </span>
      );
    case 'emergency_pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle size={12} className="text-red-500 animate-bounce" />
          <span>Emergency Pending</span>
        </span>
      );
    case 'emergency_executed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Zap size={12} className="text-purple-500" />
          <span>Emergency Executed</span>
        </span>
      );
    default:
      return null;
  }
};

export default BucketStatusBadge;
