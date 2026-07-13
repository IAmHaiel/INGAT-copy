export const formatAddress = (address: string): string => {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const formatAmount = (amount: number, decimals: number = 2): string => {
  if (amount === undefined || amount === null) return '0.00';
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatDate = (timestampInSecs: number): string => {
  if (!timestampInSecs) return '-';
  const date = new Date(timestampInSecs * 1000);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDistanceToNow = (timestampInSecs: number): string => {
  if (!timestampInSecs) return '';
  const now = Math.floor(Date.now() / 1000);
  const diff = timestampInSecs - now;
  if (diff <= 0) return 'Unlocked';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
};

// Also keep the truncateAddress and formatCurrency for backward compatibility/pre-existing components if any
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.0000000 XLM';
  return `${num.toFixed(7)} XLM`;
}
