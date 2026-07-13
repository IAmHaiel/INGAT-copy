import { xlmToUsd, formatUsd, formatXlmWithUsd } from '@/lib/utils/price';

// --- Synchronous utility tests (no module-level state dependency) ---

describe('xlmToUsd', () => {
  it('multiplies XLM amount by USD price', () => {
    expect(xlmToUsd(100, 0.14)).toBeCloseTo(14);
  });

  it('returns 0 when XLM amount is 0', () => {
    expect(xlmToUsd(0, 0.14)).toBe(0);
  });

  it('returns 0 when price is 0', () => {
    expect(xlmToUsd(100, 0)).toBe(0);
  });

  it('handles fractional amounts with precision', () => {
    expect(xlmToUsd(1.2345678, 0.25)).toBeCloseTo(0.30864195);
  });
});

describe('formatUsd', () => {
  it('formats a number as USD currency with $ symbol', () => {
    const result = formatUsd(14.5);
    expect(result).toContain('$');
  });

  it('formats with exactly 2 decimal places', () => {
    const result = formatUsd(14);
    // Should contain .00 for whole numbers
    expect(result).toMatch(/\.\d{2}$/);
  });

  it('rounds to 2 decimal places', () => {
    const result = formatUsd(14.999);
    expect(result).toContain('$');
    expect(result).toMatch(/15\.00/);
  });

  it('formats zero correctly', () => {
    const result = formatUsd(0);
    expect(result).toContain('$');
    expect(result).toMatch(/0\.00/);
  });
});

describe('formatXlmWithUsd', () => {
  it('returns string starting with ≈ followed by currency', () => {
    const result = formatXlmWithUsd(100, 0.14);
    expect(result.startsWith('≈ ')).toBe(true);
  });

  it('contains the $ currency symbol', () => {
    const result = formatXlmWithUsd(100, 0.14);
    expect(result).toContain('$');
  });

  it('includes the correct USD equivalent', () => {
    const result = formatXlmWithUsd(100, 0.25);
    // 100 * 0.25 = $25.00
    expect(result).toContain('25.00');
  });
});

// --- fetchXlmPrice tests (requires module reset due to cached state) ---

describe('fetchXlmPrice', () => {
  let fetchXlmPrice: () => Promise<number>;

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  async function importFreshModule() {
    const mod = await import('@/lib/utils/price');
    fetchXlmPrice = mod.fetchXlmPrice;
  }

  it('returns the price from a successful API response', async () => {
    await importFreshModule();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stellar: { usd: 0.42 } }),
    });

    const price = await fetchXlmPrice();
    expect(price).toBe(0.42);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns fallback price when fetch throws a network error', async () => {
    await importFreshModule();

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const price = await fetchXlmPrice();
    expect(price).toBe(0.14); // FALLBACK_PRICE_USD
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns fallback price when API returns non-ok status', async () => {
    await importFreshModule();

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    const price = await fetchXlmPrice();
    expect(price).toBe(0.14);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns fallback price when response has invalid data structure', async () => {
    await importFreshModule();

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stellar: {} }), // missing `usd` field
    });

    const price = await fetchXlmPrice();
    expect(price).toBe(0.14);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns fallback price when price is zero (invalid)', async () => {
    await importFreshModule();

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stellar: { usd: 0 } }),
    });

    const price = await fetchXlmPrice();
    expect(price).toBe(0.14);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns fallback price when price is negative (invalid)', async () => {
    await importFreshModule();

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stellar: { usd: -5 } }),
    });

    const price = await fetchXlmPrice();
    expect(price).toBe(0.14);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns cached price within cache duration without fetching again', async () => {
    await importFreshModule();

    const now = 1000000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stellar: { usd: 0.50 } }),
    });

    // First call — fetches from API
    const price1 = await fetchXlmPrice();
    expect(price1).toBe(0.50);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Advance time by less than CACHE_DURATION_MS (60_000)
    jest.spyOn(Date, 'now').mockReturnValue(now + 30_000);

    // Second call — should return cached value
    const price2 = await fetchXlmPrice();
    expect(price2).toBe(0.50);
    expect(global.fetch).toHaveBeenCalledTimes(1); // no new fetch
  });

  it('fetches fresh price after cache expires', async () => {
    await importFreshModule();

    const now = 1000000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stellar: { usd: 0.50 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stellar: { usd: 0.55 } }),
      });

    // First call
    const price1 = await fetchXlmPrice();
    expect(price1).toBe(0.50);

    // Advance time past CACHE_DURATION_MS (60_000)
    jest.spyOn(Date, 'now').mockReturnValue(now + 61_000);

    // Second call — should fetch again
    const price2 = await fetchXlmPrice();
    expect(price2).toBe(0.55);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns previously cached price on error instead of fallback', async () => {
    await importFreshModule();

    const now = 1000000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stellar: { usd: 0.42 } }),
      })
      .mockRejectedValueOnce(new Error('Network error'));

    // First call succeeds and caches 0.42
    const price1 = await fetchXlmPrice();
    expect(price1).toBe(0.42);

    // Expire cache
    jest.spyOn(Date, 'now').mockReturnValue(now + 61_000);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Second call fails — should return cached 0.42 (not fallback 0.14)
    const price2 = await fetchXlmPrice();
    expect(price2).toBe(0.42);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
