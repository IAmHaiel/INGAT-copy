interface SplitRatioBarProps {
  ratio: number;
}

export function SplitRatioBar({ ratio }: SplitRatioBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        <div
          className="bg-teal-500 transition-all duration-200"
          style={{ width: `${ratio}%` }}
        />
        <div
          className="bg-amber-500 transition-all duration-200"
          style={{ width: `${100 - ratio}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>Spending ({ratio}%)</span>
        <span>Goal ({100 - ratio}%)</span>
      </div>
    </div>
  );
}
