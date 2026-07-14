import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { DepositAllocation } from '@/types/transaction';

interface HistorySummarizerProps {
  allocations: DepositAllocation[];
  isLoading: boolean;
}

const HistorySummarizer: React.FC<HistorySummarizerProps> = ({ allocations, isLoading }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isLoading || allocations.length === 0) return;

    const currentTime = Math.floor(Date.now() / 1000);
    const totalRemitted = allocations.reduce((acc, curr) => acc + curr.amount, 0);
    const activeLocks = allocations.filter((a) => a.unlockDate > currentTime).length;

    setIsGenerating(true);
    fetch('/api/assistant/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalRemitted,
        activeLocks,
        allocationsCount: allocations.length,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.summary) {
          setSummary(data.summary);
        }
      })
      .catch((err) => console.error('Error fetching summary:', err))
      .finally(() => setIsGenerating(false));
  }, [allocations, isLoading]);

  if (isLoading || allocations.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary/5 px-5 py-4 rounded-2xl border border-primary/20 flex items-start gap-3 shadow-sm">
      <div className="bg-primary/10 p-2 rounded-lg mt-0.5">
        <Sparkles size={16} className="text-primary" />
      </div>
      <div>
        <h3 className="text-xs font-bold text-primary mb-1">AI Insights</h3>
        {isGenerating ? (
          <div className="animate-pulse flex flex-col space-y-2 mt-1 w-64">
            <div className="h-3 bg-primary/20 rounded w-full"></div>
            <div className="h-3 bg-primary/20 rounded w-4/5"></div>
          </div>
        ) : summary ? (
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
            {summary}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default HistorySummarizer;
