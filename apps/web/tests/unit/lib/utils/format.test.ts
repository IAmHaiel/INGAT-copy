import {
  formatAddress,
  formatAmount,
  formatDate,
  formatDistanceToNow,
  truncateAddress,
  formatCurrency,
} from '@/lib/utils/format';

describe('formatAddress', () => {
  it('returns empty string for empty input', () => {
    expect(formatAddress('')).toBe('');
  });

  it('returns the address unchanged if length <= 10', () => {
    expect(formatAddress('GABCDE')).toBe('GABCDE');
    expect(formatAddress('1234567890')).toBe('1234567890');
  });

  it('truncates long addresses with ellipsis', () => {
    const address = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ';
    expect(formatAddress(address)).toBe('GABCDE...WXYZ');
  });

  it('preserves first 6 and last 4 characters', () => {
    const address = 'CALZQBX7GJIQ6MZC6MIIDEJPDBHPHBDHQTGHSUTOW7A7S7OPS4V4346U';
    expect(formatAddress(address)).toBe('CALZQB...346U');
  });
});

describe('formatAmount', () => {
  it('formats a normal number with default 2 decimals', () => {
    const result = formatAmount(1234.5);
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('50');
  });

  it('formats zero', () => {
    const result = formatAmount(0);
    expect(result).toBe('0.00');
  });

  it('respects custom decimal places', () => {
    const result = formatAmount(100, 4);
    expect(result).toContain('0000');
  });

  it('returns "0.00" for null or undefined', () => {
    expect(formatAmount(null as unknown as number)).toBe('0.00');
    expect(formatAmount(undefined as unknown as number)).toBe('0.00');
  });
});

describe('formatDate', () => {
  it('returns "-" for zero timestamp', () => {
    expect(formatDate(0)).toBe('-');
  });

  it('returns a non-empty string for a valid timestamp', () => {
    const timestamp = 1700000000; // Nov 2023
    const result = formatDate(timestamp);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('-');
  });

  it('returns a non-empty string for another valid timestamp', () => {
    const timestamp = 1609459200; // Jan 1, 2021
    const result = formatDate(timestamp);
    expect(result).toBeTruthy();
    expect(result).toContain('2021');
  });
});

describe('formatDistanceToNow', () => {
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock Date.now() to return a fixed time: 1700000000 seconds (in ms)
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000 * 1000);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  it('returns empty string for zero timestamp', () => {
    expect(formatDistanceToNow(0)).toBe('');
  });

  it('returns "Unlocked" for a past timestamp', () => {
    expect(formatDistanceToNow(1699999000)).toBe('Unlocked');
  });

  it('returns "Unlocked" for the current timestamp', () => {
    expect(formatDistanceToNow(1700000000)).toBe('Unlocked');
  });

  it('returns days and hours for future timestamp with days remaining', () => {
    // 2 days and 3 hours in the future
    const future = 1700000000 + 2 * 86400 + 3 * 3600;
    expect(formatDistanceToNow(future)).toBe('2d 3h left');
  });

  it('returns hours and minutes for future timestamp with hours only', () => {
    // 5 hours and 30 minutes in the future
    const future = 1700000000 + 5 * 3600 + 30 * 60;
    expect(formatDistanceToNow(future)).toBe('5h 30m left');
  });

  it('returns minutes only for future timestamp with less than an hour', () => {
    // 45 minutes in the future
    const future = 1700000000 + 45 * 60;
    expect(formatDistanceToNow(future)).toBe('45m left');
  });

  it('returns "0m left" for 30 seconds in the future', () => {
    const future = 1700000000 + 30;
    expect(formatDistanceToNow(future)).toBe('0m left');
  });
});

describe('truncateAddress', () => {
  it('returns short address unchanged', () => {
    expect(truncateAddress('GABCDEF')).toBe('GABCDEF');
  });

  it('returns address unchanged if length <= chars*2+3', () => {
    // Default chars=4, so threshold is 4*2+3=11
    expect(truncateAddress('12345678901')).toBe('12345678901');
  });

  it('truncates long address with default chars=4', () => {
    const address = 'CALZQBX7GJIQ6MZC6MIIDEJPDBHPHBDHQTGHSUTOW7A7S7OPS4V4346U';
    expect(truncateAddress(address)).toBe('CALZ...346U');
  });

  it('respects custom chars parameter', () => {
    const address = 'CALZQBX7GJIQ6MZC6MIIDEJPDBHPHBDHQTGHSUTOW7A7S7OPS4V4346U';
    expect(truncateAddress(address, 6)).toBe('CALZQB...V4346U');
  });
});

describe('formatCurrency', () => {
  it('formats a valid number with 7 decimals and XLM suffix', () => {
    expect(formatCurrency('100.5')).toBe('100.5000000 XLM');
  });

  it('formats zero', () => {
    expect(formatCurrency('0')).toBe('0.0000000 XLM');
  });

  it('returns "0.0000000 XLM" for NaN input', () => {
    expect(formatCurrency('not-a-number')).toBe('0.0000000 XLM');
    expect(formatCurrency('')).toBe('0.0000000 XLM');
  });

  it('handles string integers', () => {
    expect(formatCurrency('42')).toBe('42.0000000 XLM');
  });

  it('handles very small amounts', () => {
    expect(formatCurrency('0.0000001')).toBe('0.0000001 XLM');
  });
});
