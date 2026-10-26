import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CryptoMarketStrip } from '../components/CryptoMarketStrip';
import { api } from '../api/client';
import { CryptoTicker } from '../types';

describe('CryptoMarketStrip Component', () => {
  const mockTickers: CryptoTicker[] = [
    {
      symbol: 'BTCUSDT',
      price: 67420.5,
      quote_currency: 'USDT',
      source: 'binance_public_spot',
      fetched_at: new Date().toISOString(),
    },
    {
      symbol: 'ETHUSDT',
      price: 3512.2,
      quote_currency: 'USDT',
      source: 'binance_public_spot',
      fetched_at: new Date().toISOString(),
    },
    {
      symbol: 'SOLUSDT',
      price: 182.4,
      quote_currency: 'USDT',
      source: 'binance_public_spot',
      fetched_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading skeleton while data is fetching', () => {
    // Return a promise that does not resolve immediately
    vi.spyOn(api, 'getCryptoTickers').mockImplementation(() => new Promise(() => {}));

    render(<CryptoMarketStrip />);

    expect(screen.getByTestId('crypto-loading-skeleton')).toBeInTheDocument();
    expect(screen.getByText('Global Crypto Spot Prices')).toBeInTheDocument();
  });

  it('renders all returned crypto pairs with correct prices and Binance Spot badge', async () => {
    vi.spyOn(api, 'getCryptoTickers').mockResolvedValue(mockTickers);

    render(<CryptoMarketStrip />);

    await waitFor(() => {
      expect(screen.getByTestId('crypto-tickers-grid')).toBeInTheDocument();
    });

    expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
    expect(screen.getByText('SOLUSDT')).toBeInTheDocument();

    expect(screen.getByText('$67,420.50')).toBeInTheDocument();
    expect(screen.getByText('$3,512.20')).toBeInTheDocument();
    expect(screen.getByText('$182.40')).toBeInTheDocument();

    expect(screen.getByText('Source: Binance Spot')).toBeInTheDocument();
    expect(screen.getByText(/Prices are public spot quotes polled via Binance REST API/i)).toBeInTheDocument();
  });

  it('renders error state and retries on button click when API call fails', async () => {
    const getSpy = vi.spyOn(api, 'getCryptoTickers').mockRejectedValueOnce(new Error('Network connection timeout'));

    render(<CryptoMarketStrip />);

    await waitFor(() => {
      expect(screen.getByTestId('crypto-error-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/Network connection timeout/i)).toBeInTheDocument();
    expect(screen.getByText('Retry Connection')).toBeInTheDocument();

    // Now resolve on retry
    getSpy.mockResolvedValueOnce(mockTickers);
    fireEvent.click(screen.getByText('Retry Connection'));

    await waitFor(() => {
      expect(screen.getByTestId('crypto-tickers-grid')).toBeInTheDocument();
    });
    expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
  });

  it('renders empty state when empty list is returned', async () => {
    vi.spyOn(api, 'getCryptoTickers').mockResolvedValue([]);

    render(<CryptoMarketStrip />);

    await waitFor(() => {
      expect(screen.getByTestId('crypto-empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/No cryptocurrency pairs returned/i)).toBeInTheDocument();
  });

  it('shows stale indicator when data is older than threshold', async () => {
    const staleDate = new Date(Date.now() - 120000).toISOString(); // 2 minutes ago
    const staleTickers: CryptoTicker[] = [
      {
        symbol: 'BTCUSDT',
        price: 65000.0,
        quote_currency: 'USDT',
        source: 'binance_public_spot',
        fetched_at: staleDate,
      },
    ];

    vi.spyOn(api, 'getCryptoTickers').mockResolvedValue(staleTickers);

    render(<CryptoMarketStrip />);

    await waitFor(() => {
      expect(screen.getByTestId('crypto-tickers-grid')).toBeInTheDocument();
    });

    expect(screen.getByText('Stale')).toBeInTheDocument();
  });
});
