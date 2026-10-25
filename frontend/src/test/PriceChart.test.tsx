import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceChart } from '../components/PriceChart';
import { Bar } from '../types';

describe('PriceChart Component', () => {
  const mockBars: Bar[] = [
    {
      interval: '1D',
      open: 2900,
      high: 2980,
      low: 2890,
      close: 2950,
      volume: 4500000,
      timestamp: '2026-10-24T00:00:00Z',
    },
    {
      interval: '1D',
      open: 2950,
      high: 3010,
      low: 2940,
      close: 3000,
      volume: 5200000,
      timestamp: '2026-10-25T00:00:00Z',
    },
  ];

  it('renders symbol, price, and resolution options', () => {
    const handleIntervalChange = vi.fn();
    render(
      <PriceChart
        bars={mockBars}
        symbol="RELIANCE"
        interval="1D"
        onIntervalChange={handleIntervalChange}
      />
    );

    expect(screen.getByText('RELIANCE')).toBeInTheDocument();
    expect(screen.getByText('1D')).toBeInTheDocument();
    expect(screen.getByText('1H')).toBeInTheDocument();
    expect(screen.getByText('15m')).toBeInTheDocument();
    expect(screen.getByText(/We Trade Seeded Feed/i)).toBeInTheDocument();
  });

  it('renders empty state when no bars provided', () => {
    render(
      <PriceChart
        bars={[]}
        symbol="TCS"
        interval="1D"
        onIntervalChange={vi.fn()}
      />
    );
    expect(screen.getByText(/No price history available for TCS/i)).toBeInTheDocument();
  });
});
