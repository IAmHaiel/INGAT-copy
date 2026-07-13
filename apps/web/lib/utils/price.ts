// XLM/USD price utility
// Fetches live price from CoinGecko API with fallback to a reasonable default

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd';
const FALLBACK_PRICE_USD = 0.14; // Reasonable fallback if API is unreachable
const CACHE_DURATION_MS = 60_000; // Cache price for 60 seconds

let cachedPrice: number | null = null;
let lastFetchTime = 0;

export const fetchXlmPrice = async (): Promise<number> => {
  const now = Date.now();

  // Return cached price if still fresh
  if (cachedPrice !== null && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedPrice;
  }

  try {
    const response = await fetch(COINGECKO_URL);
    if (!response.ok) {
      throw new Error(`Price API returned ${response.status}`);
    }
    const data = await response.json();
    const price = data?.stellar?.usd;
    if (typeof price === 'number' && price > 0) {
      cachedPrice = price;
      lastFetchTime = now;
      return price;
    }
    throw new Error('Invalid price data');
  } catch (err) {
    console.warn('Failed to fetch XLM price, using fallback:', err);
    // Use cached price if available, otherwise fallback
    return cachedPrice ?? FALLBACK_PRICE_USD;
  }
};

export const xlmToUsd = (xlmAmount: number, priceUsd: number): number => {
  return xlmAmount * priceUsd;
};

export const formatUsd = (usdAmount: number): string => {
  return usdAmount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatXlmWithUsd = (xlmAmount: number, priceUsd: number): string => {
  const usd = xlmToUsd(xlmAmount, priceUsd);
  return `≈ ${formatUsd(usd)}`;
};
