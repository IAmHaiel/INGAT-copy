"use client";

interface ReceiverAddressInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export function ReceiverAddressInput({
  value,
  onChange,
  error,
}: ReceiverAddressInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="receiver-address"
        className="text-sm font-medium text-gray-700"
      >
        Receiver Address
      </label>
      <input
        id="receiver-address"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="G..."
        className={`w-full rounded-lg border px-4 py-2.5 font-mono text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-300 focus:ring-red-500"
            : "border-gray-300 focus:ring-amber-500"
        }`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
