import { useState, useEffect } from 'react';
import { fetchXlmPrice } from '@/lib/utils/price';

export const useXlmPrice = () => {
  const [priceUsd, setPriceUsd] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const loadPrice = async () => {
      try {
        const price = await fetchXlmPrice();
        if (active) {
          setPriceUsd(price);
        }
      } catch {
        // fallback already handled in fetchXlmPrice
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadPrice();

    // Refresh price every 60 seconds
    const interval = setInterval(loadPrice, 60_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return { priceUsd, isLoading };
};
